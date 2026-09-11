-- Stage 5: student-owned progress notes for individual skills.
CREATE TABLE IF NOT EXISTS student_skill_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  note TEXT NOT NULL CHECK (char_length(btrim(note)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_skill_notes_user_skill_created_idx
  ON student_skill_notes(user_id, skill_id, created_at DESC);
