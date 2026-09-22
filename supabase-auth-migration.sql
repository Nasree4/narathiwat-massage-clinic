-- TTM Booking System: Supabase Auth migration
-- Run this in Supabase SQL Editor after creating Auth users.
-- Never put the service_role key in the website.

BEGIN;

-- Remove legacy password storage from application tables.
ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.assistants DROP COLUMN IF EXISTS password;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id
    ON public.users(auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- Link existing profiles to Auth accounts that use the same email.
-- Profiles without a matching Auth account are intentionally left unlinked.
UPDATE public.users AS profile
SET auth_user_id = auth_account.id
FROM auth.users AS auth_account
WHERE profile.auth_user_id IS NULL
  AND profile.email IS NOT NULL
  AND lower(profile.email) = lower(auth_account.email);

-- Copy only the role into Auth app metadata.
-- app_metadata is not editable by the end user and is used by RLS policies.
UPDATE auth.users AS auth_account
SET raw_app_meta_data = jsonb_set(
    COALESCE(auth_account.raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(profile.role),
    true
)
FROM public.users AS profile
WHERE profile.auth_user_id = auth_account.id
  AND profile.role IN ('user', 'staff', 'admin');

-- Ensure profiles cannot be assigned an invalid role.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'staff', 'admin'));

COMMIT;

-- Verification queries (run separately if needed):
-- SELECT id, email, auth_user_id, role FROM public.users ORDER BY created_at;
-- SELECT id, email, raw_app_meta_data->>'role' AS role FROM auth.users ORDER BY created_at;
