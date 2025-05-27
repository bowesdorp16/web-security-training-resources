-- Example RLS policies for Supabase

-- Basic RLS policy for user-owned data
CREATE POLICY "Users can only access their own data"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id);

-- RLS policy with role-based access
CREATE POLICY "Admins can see all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Secure data sharing policy
CREATE POLICY "Users can view shared items"
ON public.shared_items
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.item_shares 
    WHERE item_id = shared_items.id
  ) OR auth.uid() = owner_id
);

-- Time-based access policy
CREATE POLICY "Users can access content within publication period"
ON public.timed_content
FOR SELECT
USING (
  current_timestamp BETWEEN publish_start AND publish_end
);

-- Multi-tenant policy
CREATE POLICY "Users can only access their organization's data"
ON public.organization_data
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND org_id = organization_data.org_id
  )
);

-- Complex conditional policy
CREATE POLICY "Content access based on subscription"
ON public.premium_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = auth.uid() 
    AND subscription_level >= premium_content.required_level
    AND current_timestamp < subscription_end_date
  )
);
