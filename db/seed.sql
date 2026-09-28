-- Backfill default settings + categories for users created BEFORE schema.sql was run.
-- New users get these automatically via the on_auth_user_created trigger.
-- Safe to re-run: users that already have categories are skipped.

select public.seed_user_defaults(u.id)
from auth.users u;
