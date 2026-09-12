-- Curriculum foundation: additive provenance/version metadata.
-- Safe to apply to existing databases; no curriculum or student data is removed.
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS academic_year VARCHAR(30);
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS source_url VARCHAR(2048);
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'curricula_verification_status_check') THEN
    ALTER TABLE curricula ADD CONSTRAINT curricula_verification_status_check CHECK (verification_status IN ('verified', 'demo', 'unverified'));
  END IF;
END $$;
-- Preserve the non-official status of the existing repository demo/sample records.
UPDATE curricula SET verification_status = 'demo', source_name = COALESCE(source_name, 'JOB-LEARNER demo data')
 WHERE verification_status = 'unverified' AND (curriculum_name ILIKE '%demo%' OR description ILIKE '%demo%' OR description ILIKE '%sample%');
CREATE INDEX IF NOT EXISTS curricula_student_lookup_idx ON curricula (college_id, branch_id, id DESC);
