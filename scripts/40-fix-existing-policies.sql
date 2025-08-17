-- Drop existing policies before recreating them to avoid conflicts
-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "inspirations_select_policy" ON "outfit_inspirations";
DROP POLICY IF EXISTS "inspirations_insert_policy" ON "outfit_inspirations";
DROP POLICY IF EXISTS "inspirations_update_policy" ON "outfit_inspirations";
DROP POLICY IF EXISTS "inspirations_delete_policy" ON "outfit_inspirations";

DROP POLICY IF EXISTS "user_profiles_select_policy" ON "user_profiles";
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON "user_profiles";
DROP POLICY IF EXISTS "user_profiles_update_policy" ON "user_profiles";
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON "user_profiles";

-- Enable RLS on all tables
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outfit_inspirations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;

-- Simple, non-recursive RLS policies for user_profiles
CREATE POLICY "user_profiles_select_policy" ON "user_profiles"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON "user_profiles"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON "user_profiles"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON "user_profiles"
    FOR DELETE USING (auth.uid() = user_id);

-- Simple RLS policies for outfit_inspirations
CREATE POLICY "inspirations_select_policy" ON "outfit_inspirations"
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "inspirations_insert_policy" ON "outfit_inspirations"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inspirations_update_policy" ON "outfit_inspirations"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "inspirations_delete_policy" ON "outfit_inspirations"
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for orders
CREATE POLICY "orders_select_policy" ON "orders"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_policy" ON "orders"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_policy" ON "orders"
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for cart_items
CREATE POLICY "cart_items_select_policy" ON "cart_items"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_items_insert_policy" ON "cart_items"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_update_policy" ON "cart_items"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_items_delete_policy" ON "cart_items"
    FOR DELETE USING (auth.uid() = user_id);

-- Create automatic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, first_name, last_name, role)
  VALUES (new.id, '', '', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
