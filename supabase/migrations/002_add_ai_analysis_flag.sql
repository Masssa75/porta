-- Add column to track if analysis was done by AI or fallback
ALTER TABLE tweet_analyses 
ADD COLUMN IF NOT EXISTS is_ai_analyzed BOOLEAN DEFAULT false;

-- Add column for analysis metadata (model used, confidence, etc)
ALTER TABLE tweet_analyses 
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';

-- Update existing tweets to reflect they were not AI analyzed (if any)
UPDATE tweet_analyses 
SET is_ai_analyzed = false 
WHERE is_ai_analyzed IS NULL;

-- Add index for filtering AI vs non-AI analyzed tweets
CREATE INDEX IF NOT EXISTS idx_tweet_ai_analyzed 
ON tweet_analyses(is_ai_analyzed) 
WHERE is_ai_analyzed = true;

-- Add comment
COMMENT ON COLUMN tweet_analyses.is_ai_analyzed IS 'Whether this tweet was analyzed by AI (true) or used fallback scoring (false)';
COMMENT ON COLUMN tweet_analyses.analysis_metadata IS 'Metadata about the analysis: model used, confidence, error details, etc';