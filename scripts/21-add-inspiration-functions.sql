-- Add database functions for inspiration system

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_inspiration_likes(inspiration_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outfit_inspirations 
  SET likes_count = likes_count + 1 
  WHERE id = inspiration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_inspiration_likes(inspiration_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outfit_inspirations 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = inspiration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment saves count
CREATE OR REPLACE FUNCTION increment_inspiration_saves(inspiration_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outfit_inspirations 
  SET saves_count = saves_count + 1 
  WHERE id = inspiration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement saves count
CREATE OR REPLACE FUNCTION decrement_inspiration_saves(inspiration_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outfit_inspirations 
  SET saves_count = GREATEST(saves_count - 1, 0)
  WHERE id = inspiration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment views count
CREATE OR REPLACE FUNCTION increment_inspiration_views(inspiration_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE outfit_inspirations 
  SET views_count = views_count + 1 
  WHERE id = inspiration_id;
END;
$$ LANGUAGE plpgsql;
