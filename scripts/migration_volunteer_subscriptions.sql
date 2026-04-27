-- Create the volunteer_subscriptions table
CREATE TABLE IF NOT EXISTS public.volunteer_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  shelter_id uuid REFERENCES public.shelters(id) ON DELETE CASCADE,
  roles text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, shelter_id)
);

-- Enable RLS
ALTER TABLE public.volunteer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read (so public profiles/shelters can see volunteers)
CREATE POLICY "Volunteers viewable by everyone" ON public.volunteer_subscriptions
  FOR SELECT USING (true);

-- Users can insert/update/delete their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON public.volunteer_subscriptions
  FOR ALL USING (auth.uid() = user_id);
