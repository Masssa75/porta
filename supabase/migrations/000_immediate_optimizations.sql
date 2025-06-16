-- Immediate optimizations for tweet_analyses table
-- This can be run right away without data migration

-- Step 1: Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tweet_project_created 
    ON tweet_analyses(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tweet_project_importance 
    ON tweet_analyses(project_id, importance_score DESC);

CREATE INDEX IF NOT EXISTS idx_tweet_created_at 
    ON tweet_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tweet_importance_high 
    ON tweet_analyses(importance_score) 
    WHERE importance_score >= 7;

-- Step 2: Add full-text search capability
CREATE INDEX IF NOT EXISTS idx_tweet_text_search 
    ON tweet_analyses 
    USING gin(to_tsvector('english', tweet_text));

-- Step 3: Create useful views for common queries

-- Recent important tweets view
CREATE OR REPLACE VIEW v_recent_important_tweets AS
SELECT 
    t.id,
    t.project_id,
    p.name as project_name,
    p.symbol as project_symbol,
    t.tweet_text,
    t.author,
    t.created_at,
    t.importance_score,
    t.category,
    t.summary,
    t.url
FROM tweet_analyses t
JOIN projects p ON t.project_id = p.id
WHERE t.created_at > NOW() - INTERVAL '7 days'
  AND t.importance_score >= 7
ORDER BY t.importance_score DESC, t.created_at DESC;

-- Daily statistics per project
CREATE OR REPLACE VIEW v_daily_tweet_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.symbol as project_symbol,
    DATE(t.created_at) as date,
    COUNT(*) as tweet_count,
    ROUND(AVG(t.importance_score)::numeric, 2) as avg_importance,
    MAX(t.importance_score) as max_importance,
    COUNT(*) FILTER (WHERE t.importance_score >= 7) as high_importance_count,
    COUNT(*) FILTER (WHERE t.importance_score >= 9) as critical_tweets
FROM tweet_analyses t
JOIN projects p ON t.project_id = p.id
WHERE t.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.symbol, DATE(t.created_at)
ORDER BY date DESC, p.name;

-- Latest tweets per project
CREATE OR REPLACE VIEW v_latest_project_tweets AS
SELECT DISTINCT ON (project_id)
    t.id,
    t.project_id,
    p.name as project_name,
    p.symbol as project_symbol,
    t.tweet_text,
    t.author,
    t.created_at,
    t.importance_score,
    t.category
FROM tweet_analyses t
JOIN projects p ON t.project_id = p.id
ORDER BY project_id, created_at DESC;

-- Step 4: Create function to clean up duplicate tweets
CREATE OR REPLACE FUNCTION remove_duplicate_tweets()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH duplicates AS (
        SELECT id
        FROM (
            SELECT 
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY project_id, tweet_text 
                    ORDER BY created_at DESC
                ) as rn
            FROM tweet_analyses
        ) t
        WHERE rn > 1
    )
    DELETE FROM tweet_analyses
    WHERE id IN (SELECT id FROM duplicates);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get project tweet summary
CREATE OR REPLACE FUNCTION get_project_summary(
    p_project_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_tweets BIGINT,
    avg_importance NUMERIC,
    high_importance_count BIGINT,
    categories JSONB,
    top_tweets JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            ROUND(AVG(importance_score)::numeric, 2) as avg_imp,
            COUNT(*) FILTER (WHERE importance_score >= 7) as high_imp
        FROM tweet_analyses
        WHERE project_id = p_project_id
          AND created_at > NOW() - (p_days || ' days')::INTERVAL
    ),
    cats AS (
        SELECT jsonb_object_agg(
            COALESCE(category, 'uncategorized'), 
            count
        ) as categories
        FROM (
            SELECT category, COUNT(*) as count
            FROM tweet_analyses
            WHERE project_id = p_project_id
              AND created_at > NOW() - (p_days || ' days')::INTERVAL
            GROUP BY category
        ) c
    ),
    top AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'text', LEFT(tweet_text, 100),
                'score', importance_score,
                'created_at', created_at
            )
        ) as top_tweets
        FROM (
            SELECT id, tweet_text, importance_score, created_at
            FROM tweet_analyses
            WHERE project_id = p_project_id
              AND created_at > NOW() - (p_days || ' days')::INTERVAL
            ORDER BY importance_score DESC, created_at DESC
            LIMIT 5
        ) t
    )
    SELECT 
        stats.total,
        stats.avg_imp,
        stats.high_imp,
        cats.categories,
        top.top_tweets
    FROM stats, cats, top;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add helpful comments
COMMENT ON INDEX idx_tweet_project_created IS 'Primary index for fetching tweets by project in chronological order';
COMMENT ON INDEX idx_tweet_project_importance IS 'Index for finding high-importance tweets by project';
COMMENT ON INDEX idx_tweet_text_search IS 'Full-text search index for tweet content';
COMMENT ON VIEW v_recent_important_tweets IS 'Shows all tweets with importance >= 7 from the last 7 days';
COMMENT ON VIEW v_daily_tweet_stats IS 'Daily statistics for each project over the last 30 days';
COMMENT ON FUNCTION get_project_summary IS 'Get comprehensive summary statistics for a specific project';

-- Step 7: Analyze table to update statistics
ANALYZE tweet_analyses;

-- Usage examples:
/*
-- Find recent important tweets for a project
SELECT * FROM v_recent_important_tweets 
WHERE project_id = '11b4da6c-df34-480e-9c19-89e958c0db34';

-- Get daily stats
SELECT * FROM v_daily_tweet_stats 
WHERE project_name = 'Kaspa'
ORDER BY date DESC;

-- Search tweets by content
SELECT * FROM tweet_analyses
WHERE to_tsvector('english', tweet_text) @@ plainto_tsquery('english', 'partnership announcement');

-- Get project summary
SELECT * FROM get_project_summary('11b4da6c-df34-480e-9c19-89e958c0db34'::uuid, 30);

-- Remove duplicates
SELECT remove_duplicate_tweets();
*/