-- Migration 012: Student Roadmap Progress Persistence

CREATE TABLE IF NOT EXISTS student_roadmap_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id BIGINT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, roadmap_id, step_number)
);

CREATE INDEX IF NOT EXISTS student_roadmap_progress_user_roadmap_idx 
  ON student_roadmap_progress(user_id, roadmap_id);
