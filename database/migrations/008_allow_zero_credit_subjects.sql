-- Allow legitimate 0-credit curriculum subjects.
-- Safe/additive: this does not remove any existing data.

ALTER TABLE subjects
  DROP CONSTRAINT IF EXISTS subjects_credits_check;

ALTER TABLE subjects
  ADD CONSTRAINT subjects_credits_check
  CHECK (credits >= 0 AND credits <= 30);