-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "stripe_subscription_id" TEXT NOT NULL,
  "stripe_customer_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "plan_type" TEXT NOT NULL,
  "current_period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE("user_id"),
  UNIQUE("stripe_subscription_id")
);

-- Enable Row Level Security
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
  ON "subscriptions"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON "subscriptions"
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON "subscriptions" TO authenticated;
GRANT ALL ON "subscriptions" TO service_role; 