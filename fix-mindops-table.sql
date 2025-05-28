-- Fix mindops table structure - remove google_sheet_url column if exists
-- and ensure table exists with correct structure

-- Drop the column if it exists (this won't fail if column doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'mindops' 
        AND column_name = 'google_sheet_url'
    ) THEN
        ALTER TABLE mindops DROP COLUMN google_sheet_url;
        RAISE NOTICE 'Dropped google_sheet_url column from mindops table';
    ELSE
        RAISE NOTICE 'google_sheet_url column does not exist in mindops table';
    END IF;
END $$;

-- Ensure mindops table exists with correct structure
CREATE TABLE IF NOT EXISTS mindops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mindop_name TEXT NOT NULL,
    mindop_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mindops_updated_at ON mindops;
CREATE TRIGGER update_mindops_updated_at
    BEFORE UPDATE ON mindops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE mindops ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own mindops
DROP POLICY IF EXISTS "Users can view their own mindops" ON mindops;
CREATE POLICY "Users can view their own mindops" ON mindops
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mindops" ON mindops;
CREATE POLICY "Users can insert their own mindops" ON mindops
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mindops" ON mindops;
CREATE POLICY "Users can update their own mindops" ON mindops
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mindops" ON mindops;
CREATE POLICY "Users can delete their own mindops" ON mindops
    FOR DELETE USING (auth.uid() = user_id);

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mindops' 
ORDER BY ordinal_position;
