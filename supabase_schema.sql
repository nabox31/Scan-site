-- SQL Schema for Supabase Webcomic Reader
-- Run this in the Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Series table
CREATE TABLE IF NOT EXISTS series (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    chapter_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    chapter_number NUMERIC NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(series_id, chapter_number)
);

-- Chapter images table
CREATE TABLE IF NOT EXISTS chapter_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chapter_id, page_number)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);
CREATE INDEX IF NOT EXISTS idx_images_chapter_id ON chapter_images(chapter_id);
CREATE INDEX IF NOT EXISTS idx_images_page ON chapter_images(page_number);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update chapter count
CREATE OR REPLACE FUNCTION update_chapter_count(series_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE series
    SET chapter_count = (
        SELECT COUNT(*) FROM chapters WHERE chapters.series_id = update_chapter_count.series_id
    ),
    updated_at = NOW()
    WHERE id = series_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-update chapter count trigger
CREATE OR REPLACE FUNCTION trigger_update_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_chapter_count(NEW.series_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_chapter_count(OLD.series_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chapters_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON chapters
FOR EACH ROW
EXECUTE FUNCTION trigger_update_chapter_count();

-- ============================================
-- RLS POLICIES (Enable public read, admin write)
-- ============================================

-- Enable RLS
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_images ENABLE ROW LEVEL SECURITY;

-- Series policies
CREATE POLICY "Allow public read on series"
    ON series FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all insert on series"
    ON series FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all update on series"
    ON series FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all delete on series"
    ON series FOR DELETE
    TO anon, authenticated
    USING (true);

-- Chapters policies
CREATE POLICY "Allow public read on chapters"
    ON chapters FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all insert on chapters"
    ON chapters FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all update on chapters"
    ON chapters FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all delete on chapters"
    ON chapters FOR DELETE
    TO anon, authenticated
    USING (true);

-- Chapter images policies
CREATE POLICY "Allow public read on chapter_images"
    ON chapter_images FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all insert on chapter_images"
    ON chapter_images FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all update on chapter_images"
    ON chapter_images FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all delete on chapter_images"
    ON chapter_images FOR DELETE
    TO anon, authenticated
    USING (true);
