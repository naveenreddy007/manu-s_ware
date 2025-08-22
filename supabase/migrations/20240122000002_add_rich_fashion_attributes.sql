-- Migration: Add Rich Fashion Attributes to Wardrobe Items and Products
-- This migration adds comprehensive fashion metadata to both tables to power advanced recommendations

-- Add rich fashion attributes to wardrobe_items table
ALTER TABLE public.wardrobe_items 
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS pattern TEXT,
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS occasion TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS fit TEXT,
ADD COLUMN IF NOT EXISTS neckline TEXT,
ADD COLUMN IF NOT EXISTS sleeve_length TEXT,
ADD COLUMN IF NOT EXISTS formality_score INTEGER CHECK (formality_score >= 1 AND formality_score <= 5);

-- Add rich fashion attributes to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS pattern TEXT,
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS occasion TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS fit TEXT,
ADD COLUMN IF NOT EXISTS neckline TEXT,
ADD COLUMN IF NOT EXISTS sleeve_length TEXT,
ADD COLUMN IF NOT EXISTS formality_score INTEGER CHECK (formality_score >= 1 AND formality_score <= 5);

-- Create indexes for better query performance on commonly filtered attributes
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_style ON public.wardrobe_items(style);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_occasion ON public.wardrobe_items(occasion);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_season ON public.wardrobe_items(season);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_formality_score ON public.wardrobe_items(formality_score);

CREATE INDEX IF NOT EXISTS idx_products_style ON public.products(style);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON public.products(occasion);
CREATE INDEX IF NOT EXISTS idx_products_season ON public.products(season);
CREATE INDEX IF NOT EXISTS idx_products_formality_score ON public.products(formality_score);

-- Add comments for documentation
COMMENT ON COLUMN public.wardrobe_items.style IS 'Fashion style (e.g., casual, formal, bohemian, minimalist)';
COMMENT ON COLUMN public.wardrobe_items.pattern IS 'Pattern type (e.g., solid, striped, floral, geometric)';
COMMENT ON COLUMN public.wardrobe_items.material IS 'Primary material (e.g., cotton, silk, denim, wool)';
COMMENT ON COLUMN public.wardrobe_items.occasion IS 'Suitable occasion (e.g., work, party, casual, formal)';
COMMENT ON COLUMN public.wardrobe_items.season IS 'Seasonal appropriateness (e.g., spring, summer, fall, winter, all-season)';
COMMENT ON COLUMN public.wardrobe_items.fit IS 'Fit type (e.g., slim, regular, loose, oversized)';
COMMENT ON COLUMN public.wardrobe_items.neckline IS 'Neckline style (e.g., crew, v-neck, scoop, off-shoulder)';
COMMENT ON COLUMN public.wardrobe_items.sleeve_length IS 'Sleeve length (e.g., sleeveless, short, long, 3/4)';
COMMENT ON COLUMN public.wardrobe_items.formality_score IS 'Formality level from 1 (very casual) to 5 (very formal)';

COMMENT ON COLUMN public.products.style IS 'Fashion style (e.g., casual, formal, bohemian, minimalist)';
COMMENT ON COLUMN public.products.pattern IS 'Pattern type (e.g., solid, striped, floral, geometric)';
COMMENT ON COLUMN public.products.material IS 'Primary material (e.g., cotton, silk, denim, wool)';
COMMENT ON COLUMN public.products.occasion IS 'Suitable occasion (e.g., work, party, casual, formal)';
COMMENT ON COLUMN public.products.season IS 'Seasonal appropriateness (e.g., spring, summer, fall, winter, all-season)';
COMMENT ON COLUMN public.products.fit IS 'Fit type (e.g., slim, regular, loose, oversized)';
COMMENT ON COLUMN public.products.neckline IS 'Neckline style (e.g., crew, v-neck, scoop, off-shoulder)';
COMMENT ON COLUMN public.products.sleeve_length IS 'Sleeve length (e.g., sleeveless, short, long, 3/4)';
COMMENT ON COLUMN public.products.formality_score IS 'Formality level from 1 (very casual) to 5 (very formal)';

-- Success notification
DO $$ 
BEGIN 
    RAISE NOTICE 'Successfully added rich fashion attributes to wardrobe_items and products tables';
    RAISE NOTICE 'Added columns: style, pattern, material, occasion, season, fit, neckline, sleeve_length, formality_score';
    RAISE NOTICE 'Created performance indexes for commonly queried attributes';
END $$;
