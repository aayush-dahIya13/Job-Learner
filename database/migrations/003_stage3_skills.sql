-- Apply to existing Stage 1/2 databases after the existing schema.
-- All statements are additive and safe to run repeatedly.
CREATE TABLE IF NOT EXISTS skills (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, category TEXT, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS job_roles (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL UNIQUE, description TEXT, category TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS job_role_skills (job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE, skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE, required_level INTEGER NOT NULL DEFAULT 1 CHECK (required_level BETWEEN 1 AND 5), importance INTEGER NOT NULL DEFAULT 1 CHECK (importance BETWEEN 1 AND 5), PRIMARY KEY (job_role_id, skill_id));
CREATE TABLE IF NOT EXISTS student_skills (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE, proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (user_id, skill_id));
CREATE TABLE IF NOT EXISTS student_career_goals (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_role_id BIGINT NOT NULL REFERENCES job_roles(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (user_id, job_role_id), UNIQUE (user_id));
CREATE INDEX IF NOT EXISTS skills_name_idx ON skills(name);
CREATE INDEX IF NOT EXISTS job_roles_title_idx ON job_roles(title);
CREATE INDEX IF NOT EXISTS job_role_skills_job_role_id_idx ON job_role_skills(job_role_id);
CREATE INDEX IF NOT EXISTS job_role_skills_skill_id_idx ON job_role_skills(skill_id);
CREATE INDEX IF NOT EXISTS student_skills_user_id_idx ON student_skills(user_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_id_idx ON student_skills(skill_id);
