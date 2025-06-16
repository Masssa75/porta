-- Migration: Optimize tweet storage with partitioning and indexing
-- WARNING: This migration requires careful execution. Create a backup first!

-- Step 1: Create new partitioned table structure
CREATE TABLE IF NOT EXISTS tweet_analyses_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  tweet_text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  importance_score INTEGER DEFAULT 0 CHECK (importance_score >= 0 AND importance_score <= 10),
  category TEXT,
  summary TEXT,
  url TEXT,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create indexes on partitioned table
CREATE INDEX idx_tweet_part_project_created ON tweet_analyses_partitioned (project_id, created_at DESC);
CREATE INDEX idx_tweet_part_project_importance ON tweet_analyses_partitioned (project_id, importance_score DESC);
CREATE INDEX idx_tweet_part_tweet_id ON tweet_analyses_partitioned (tweet_id);
CREATE INDEX idx_tweet_part_created_at ON tweet_analyses_partitioned (created_at DESC);

-- Step 2: Create function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    -- Create partitions for the next 3 months
    FOR i IN 0..3 LOOP
        start_date := date_trunc('month', CURRENT_DATE + (i || ' months')::interval);
        end_date := start_date + interval '1 month';
        partition_name := 'tweet_analyses_' || to_char(start_date, 'YYYY_MM');
        
        -- Check if partition already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF tweet_analyses_partitioned 
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
            RAISE NOTICE 'Created partition: %', partition_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create initial partitions
SELECT create_monthly_partition();

-- Step 3: Create trigger to ensure partitions exist before insert
CREATE OR REPLACE FUNCTION ensure_partition_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Create partition if it doesn't exist for the insert date
    PERFORM create_monthly_partition();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_partition_trigger
    BEFORE INSERT ON tweet_analyses_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION ensure_partition_exists();

-- Step 4: Copy existing data to new partitioned table
-- This is done in batches to avoid locking issues
DO $$
DECLARE
    batch_size INTEGER := 10000;
    offset_val INTEGER := 0;
    row_count INTEGER;
BEGIN
    LOOP
        INSERT INTO tweet_analyses_partitioned 
        SELECT * FROM tweet_analyses
        ORDER BY created_at
        LIMIT batch_size
        OFFSET offset_val;
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        
        IF row_count = 0 THEN
            EXIT;
        END IF;
        
        offset_val := offset_val + batch_size;
        RAISE NOTICE 'Migrated % rows', offset_val;
        
        -- Small delay to reduce load
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- Step 5: Rename tables to swap them
ALTER TABLE tweet_analyses RENAME TO tweet_analyses_old;
ALTER TABLE tweet_analyses_partitioned RENAME TO tweet_analyses;

-- Step 6: Re-enable RLS on new table
ALTER TABLE tweet_analyses ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Enable read access for all users" ON tweet_analyses
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON tweet_analyses
    FOR INSERT WITH CHECK (true);

-- Step 7: Create additional performance indexes
CREATE INDEX idx_tweet_text_search ON tweet_analyses 
    USING gin(to_tsvector('english', tweet_text));

-- Step 8: Create archive table for old tweets
CREATE TABLE IF NOT EXISTS tweet_analyses_archive (
    LIKE tweet_analyses INCLUDING ALL
);

-- Step 9: Create function to archive old tweets
CREATE OR REPLACE FUNCTION archive_old_tweets(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH archived AS (
        DELETE FROM tweet_analyses
        WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO tweet_analyses_archive
    SELECT * FROM archived;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create materialized views for common queries
CREATE MATERIALIZED VIEW recent_important_tweets AS
SELECT 
    t.*,
    p.name as project_name,
    p.symbol as project_symbol
FROM tweet_analyses t
JOIN projects p ON t.project_id = p.id
WHERE t.created_at > NOW() - INTERVAL '7 days'
  AND t.importance_score >= 7
ORDER BY t.importance_score DESC, t.created_at DESC;

CREATE INDEX idx_recent_important_project ON recent_important_tweets(project_id);
CREATE INDEX idx_recent_important_score ON recent_important_tweets(importance_score DESC);

-- Step 11: Create view for daily statistics
CREATE OR REPLACE VIEW daily_tweet_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.symbol as project_symbol,
    DATE(t.created_at) as date,
    COUNT(*) as tweet_count,
    AVG(t.importance_score) as avg_importance,
    MAX(t.importance_score) as max_importance,
    COUNT(*) FILTER (WHERE t.importance_score >= 7) as high_importance_count
FROM tweet_analyses t
JOIN projects p ON t.project_id = p.id
WHERE t.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.symbol, DATE(t.created_at);

-- Step 12: Create scheduled job to maintain partitions (requires pg_cron extension)
-- Note: This needs to be run as superuser or database owner
/*
SELECT cron.schedule(
    'create-monthly-partitions',
    '0 0 1 * *', -- Run on the 1st of each month
    'SELECT create_monthly_partition();'
);

SELECT cron.schedule(
    'archive-old-tweets',
    '0 2 * * 0', -- Run every Sunday at 2 AM
    'SELECT archive_old_tweets(90);'
);

SELECT cron.schedule(
    'refresh-materialized-views',
    '*/30 * * * *', -- Run every 30 minutes
    'REFRESH MATERIALIZED VIEW CONCURRENTLY recent_important_tweets;'
);
*/

-- Step 13: Add table for tracking partition maintenance
CREATE TABLE IF NOT EXISTS partition_maintenance_log (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    partition_name TEXT,
    rows_affected INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- Step 14: Create function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(months_to_keep INTEGER DEFAULT 6)
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    FOR partition_record IN 
        SELECT 
            schemaname,
            tablename,
            regexp_replace(tablename, 'tweet_analyses_', '')::date as partition_date
        FROM pg_tables
        WHERE tablename LIKE 'tweet_analyses_%'
          AND schemaname = 'public'
          AND regexp_replace(tablename, 'tweet_analyses_', '')::date < 
              date_trunc('month', CURRENT_DATE - (months_to_keep || ' months')::interval)
    LOOP
        EXECUTE format('DROP TABLE %I.%I', partition_record.schemaname, partition_record.tablename);
        dropped_count := dropped_count + 1;
        
        INSERT INTO partition_maintenance_log (action, partition_name, details)
        VALUES ('DROP_PARTITION', partition_record.tablename, 
                jsonb_build_object('partition_date', partition_record.partition_date));
    END LOOP;
    
    IF dropped_count > 0 THEN
        RAISE NOTICE 'Dropped % old partitions', dropped_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Final step: Clean up old table after verification
-- WARNING: Only run this after confirming data migration is successful!
-- DROP TABLE IF EXISTS tweet_analyses_old;

-- Helpful queries for monitoring:
/*
-- Check partition sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'tweet_analyses_%'
ORDER BY tablename;

-- Check tweet distribution across partitions
SELECT 
    tableoid::regclass as partition_name,
    COUNT(*) as row_count,
    MIN(created_at) as min_date,
    MAX(created_at) as max_date
FROM tweet_analyses
GROUP BY tableoid
ORDER BY MIN(created_at);
*/