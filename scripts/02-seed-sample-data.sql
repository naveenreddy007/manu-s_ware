-- Insert sample MANUS products
INSERT INTO products (name, description, price, category, subcategory, color, sizes, images, tags) VALUES
('Essential Cotton Tee', 'Premium cotton t-shirt with perfect fit', 45.00, 'tops', 'tshirts', 'white', ARRAY['S', 'M', 'L', 'XL'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['casual', 'essential', 'cotton']),
('Tailored Chino Pants', 'Modern fit chino pants for versatile styling', 89.00, 'bottoms', 'pants', 'navy', ARRAY['30', '32', '34', '36'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['smart-casual', 'versatile', 'cotton']),
('Merino Wool Sweater', 'Luxurious merino wool crew neck sweater', 125.00, 'tops', 'sweaters', 'charcoal', ARRAY['S', 'M', 'L', 'XL'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['premium', 'wool', 'layering']),
('Oxford Button Shirt', 'Classic oxford shirt for professional looks', 75.00, 'tops', 'shirts', 'light-blue', ARRAY['S', 'M', 'L', 'XL'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['professional', 'classic', 'cotton']),
('Minimalist Sneakers', 'Clean white leather sneakers', 110.00, 'shoes', 'sneakers', 'white', ARRAY['8', '9', '10', '11', '12'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['casual', 'leather', 'minimalist']),
('Wool Blend Blazer', 'Structured blazer for elevated looks', 195.00, 'outerwear', 'blazers', 'navy', ARRAY['S', 'M', 'L', 'XL'], ARRAY['/placeholder.svg?height=400&width=300'], ARRAY['formal', 'wool', 'structured']);

-- Insert sample categories for reference
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_category VARCHAR(100),
  display_order INTEGER DEFAULT 0
);

INSERT INTO categories (name, parent_category, display_order) VALUES
('tops', NULL, 1),
('bottoms', NULL, 2),
('outerwear', NULL, 3),
('shoes', NULL, 4),
('accessories', NULL, 5),
('tshirts', 'tops', 1),
('shirts', 'tops', 2),
('sweaters', 'tops', 3),
('pants', 'bottoms', 1),
('jeans', 'bottoms', 2),
('shorts', 'bottoms', 3),
('blazers', 'outerwear', 1),
('jackets', 'outerwear', 2),
('coats', 'outerwear', 3),
('sneakers', 'shoes', 1),
('dress-shoes', 'shoes', 2),
('boots', 'shoes', 3);
