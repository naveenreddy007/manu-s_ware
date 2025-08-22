-- Migration: Create webhook to track affiliate sales
-- This migration sets up a webhook that triggers the track-affiliate-sale Edge Function
-- whenever a new order is inserted into the orders table

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_affiliate_sale_tracking()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSONB;
  response TEXT;
BEGIN
  -- Construct the Edge Function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/track-affiliate-sale';
  
  -- Prepare the payload with order data
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'orders',
    'record', row_to_json(NEW),
    'schema', 'public'
  );

  -- Call the Edge Function using http extension
  -- Note: This requires the http extension to be enabled
  SELECT content INTO response
  FROM http((
    'POST',
    function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))
    ],
    payload::TEXT
  )::http_request);

  -- Log the response for debugging
  RAISE LOG 'Affiliate tracking webhook response: %', response;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the original insert
    RAISE LOG 'Error in affiliate tracking webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS track_affiliate_sale_webhook ON public.orders;

CREATE TRIGGER track_affiliate_sale_webhook
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_affiliate_sale_tracking();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Add a comment to document the webhook
COMMENT ON TRIGGER track_affiliate_sale_webhook ON public.orders IS 
'Webhook that triggers the track-affiliate-sale Edge Function when new orders are inserted';

COMMENT ON FUNCTION public.trigger_affiliate_sale_tracking() IS 
'Function that calls the track-affiliate-sale Edge Function to process affiliate commissions';
