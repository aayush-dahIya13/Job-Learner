-- Stage 4 additive migration. Safe to run on an existing Stage 1–3 database.
CREATE TABLE IF NOT EXISTS career_analyses (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100), analysis JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS career_analyses_user_generated_idx ON career_analyses(user_id, generated_at DESC);
CREATE TABLE IF NOT EXISTS roadmaps (
  id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100), generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS roadmap_items (
  id BIGSERIAL PRIMARY KEY, roadmap_id BIGINT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number > 0), title TEXT NOT NULL, objective TEXT, reason TEXT,
  difficulty TEXT, project_idea TEXT, CONSTRAINT roadmap_items_roadmap_phase_key UNIQUE (roadmap_id, phase_number)
);
CREATE TABLE IF NOT EXISTS roadmap_item_skills (
  roadmap_item_id BIGINT NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  skill_id BIGINT REFERENCES skills(id) ON DELETE SET NULL, skill_name TEXT NOT NULL,
  PRIMARY KEY (roadmap_item_id, skill_name)
);
CREATE INDEX IF NOT EXISTS roadmaps_user_generated_idx ON roadmaps(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS roadmap_items_roadmap_id_idx ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS roadmap_item_skills_item_id_idx ON roadmap_item_skills(roadmap_item_id);
