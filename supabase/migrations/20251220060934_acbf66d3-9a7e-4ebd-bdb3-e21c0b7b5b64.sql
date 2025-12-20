-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');

-- Create enum for tax types
CREATE TYPE public.tax_type AS ENUM ('Property Tax', 'Water Tax', 'Drainage Tax', 'Commercial Tax');

-- Create enum for behavior segments
CREATE TYPE public.behavior_segment AS ENUM ('Regular Payer', 'Occasional Defaulter', 'Chronic Defaulter', 'First-time Defaulter');

-- Create enum for nudge status
CREATE TYPE public.nudge_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Create enum for nudge type
CREATE TYPE public.nudge_type AS ENUM ('sms', 'whatsapp', 'email');

-- Create enum for officer roles
CREATE TYPE public.officer_role AS ENUM ('admin', 'supervisor', 'officer');

-- Create profiles table for officers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT DEFAULT 'MA&UD',
  designation TEXT,
  ward_assigned TEXT,
  zone_assigned TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role officer_role NOT NULL DEFAULT 'officer',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Create taxpayers table
CREATE TABLE public.taxpayers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  ward TEXT NOT NULL,
  zone TEXT NOT NULL,
  property_address TEXT NOT NULL,
  tax_type tax_type NOT NULL DEFAULT 'Property Tax',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tax_records table
CREATE TABLE public.tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id TEXT NOT NULL REFERENCES public.taxpayers(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  due_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  arrears_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  penalty_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date TIMESTAMPTZ,
  delay_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create risk_scores table
CREATE TABLE public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id TEXT NOT NULL REFERENCES public.taxpayers(id) ON DELETE CASCADE,
  risk_score DECIMAL(5,4) NOT NULL,
  risk_level risk_level NOT NULL,
  behavior_segment behavior_segment NOT NULL,
  risk_factors JSONB NOT NULL DEFAULT '[]',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_by UUID REFERENCES auth.users(id)
);

-- Create nudges table
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id TEXT NOT NULL REFERENCES public.taxpayers(id) ON DELETE CASCADE,
  nudge_type nudge_type NOT NULL,
  message TEXT NOT NULL,
  status nudge_status NOT NULL DEFAULT 'pending',
  risk_level risk_level NOT NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxpayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role officer_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is any officer
CREATE OR REPLACE FUNCTION public.is_officer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Officers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_officer(auth.uid()));

-- User roles RLS policies
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Taxpayers RLS policies
CREATE POLICY "Officers can view all taxpayers"
ON public.taxpayers FOR SELECT
TO authenticated
USING (public.is_officer(auth.uid()));

CREATE POLICY "Officers can insert taxpayers"
ON public.taxpayers FOR INSERT
TO authenticated
WITH CHECK (public.is_officer(auth.uid()));

CREATE POLICY "Officers can update taxpayers"
ON public.taxpayers FOR UPDATE
TO authenticated
USING (public.is_officer(auth.uid()));

-- Tax records RLS policies
CREATE POLICY "Officers can view all tax records"
ON public.tax_records FOR SELECT
TO authenticated
USING (public.is_officer(auth.uid()));

CREATE POLICY "Officers can manage tax records"
ON public.tax_records FOR ALL
TO authenticated
USING (public.is_officer(auth.uid()));

-- Risk scores RLS policies
CREATE POLICY "Officers can view all risk scores"
ON public.risk_scores FOR SELECT
TO authenticated
USING (public.is_officer(auth.uid()));

CREATE POLICY "Officers can create risk scores"
ON public.risk_scores FOR INSERT
TO authenticated
WITH CHECK (public.is_officer(auth.uid()));

-- Nudges RLS policies
CREATE POLICY "Officers can view all nudges"
ON public.nudges FOR SELECT
TO authenticated
USING (public.is_officer(auth.uid()));

CREATE POLICY "Officers can create nudges"
ON public.nudges FOR INSERT
TO authenticated
WITH CHECK (public.is_officer(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Officers can update their nudges"
ON public.nudges FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default officer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'officer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taxpayers_updated_at
BEFORE UPDATE ON public.taxpayers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_records_updated_at
BEFORE UPDATE ON public.tax_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_taxpayers_ward ON public.taxpayers(ward);
CREATE INDEX idx_taxpayers_zone ON public.taxpayers(zone);
CREATE INDEX idx_tax_records_taxpayer ON public.tax_records(taxpayer_id);
CREATE INDEX idx_risk_scores_taxpayer ON public.risk_scores(taxpayer_id);
CREATE INDEX idx_risk_scores_level ON public.risk_scores(risk_level);
CREATE INDEX idx_nudges_taxpayer ON public.nudges(taxpayer_id);
CREATE INDEX idx_nudges_status ON public.nudges(status);