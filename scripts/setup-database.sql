-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create waitlist table for email collection
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questionnaire_responses table
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  responses JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table for revenue tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update profiles
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Insert the admin user profile (update with the user ID from the script output)
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES ('67873ad8-6119-48b6-a365-bca12d192577', 'admin@vownow.com', 'Admin User', 'admin', 'active')
ON CONFLICT (id) DO UPDATE
SET role = 'admin', status = 'active', full_name = 'Admin User';