-- JOB-LEARNER Stage 1 PostgreSQL schema
-- Apply with: npm run db:schema

CREATE TABLE IF NOT EXISTS colleges (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(120),
  state VARCHAR(120),
  university VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT colleges_name_city_key UNIQUE (name, city)
);

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(30) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  contact_number VARCHAR(20) NOT NULL,
  college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  current_year INTEGER NOT NULL CHECK (current_year BETWEEN 1 AND 4),
  career_goal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_profiles_current_year_check CHECK (current_year BETWEEN 1 AND 4)
);

CREATE INDEX IF NOT EXISTS student_profiles_college_id_idx ON student_profiles(college_id);
CREATE INDEX IF NOT EXISTS student_profiles_branch_id_idx ON student_profiles(branch_id);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- Safe upgrades for databases created by Stage 1. These never remove data.
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS university VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS code VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin'));
CREATE UNIQUE INDEX IF NOT EXISTS branches_code_key ON branches(code) WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS college_branches (
  id BIGSERIAL PRIMARY KEY,
  college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT college_branches_college_branch_key UNIQUE (college_id, branch_id)
);

CREATE TABLE IF NOT EXISTS curricula (
  id BIGSERIAL PRIMARY KEY,
  college_id BIGINT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  curriculum_name VARCHAR(255) NOT NULL,
  regulation_version VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT curricula_college_branch_version_key UNIQUE (college_id, branch_id, regulation_version)
);
CREATE TABLE IF NOT EXISTS semesters (
  id BIGSERIAL PRIMARY KEY,
  curriculum_id BIGINT NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
  semester_number SMALLINT NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
  CONSTRAINT semesters_curriculum_number_key UNIQUE (curriculum_id, semester_number)
);
CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  semester_id BIGINT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  subject_code VARCHAR(40) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  credits NUMERIC(4,1) NOT NULL CHECK (credits > 0 AND credits <= 30),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subjects_semester_code_key UNIQUE (semester_id, subject_code)
);
CREATE INDEX IF NOT EXISTS college_branches_college_id_idx ON college_branches(college_id);
CREATE INDEX IF NOT EXISTS curricula_college_branch_idx ON curricula(college_id, branch_id);
CREATE INDEX IF NOT EXISTS semesters_curriculum_id_idx ON semesters(curriculum_id);
CREATE INDEX IF NOT EXISTS subjects_semester_id_idx ON subjects(semester_id);

-- Stage 3: skills, target roles, and student skill assessments.
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS job_roles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS job_role_skills (
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INTEGER NOT NULL DEFAULT 1 CHECK (required_level BETWEEN 1 AND 5),
  importance INTEGER NOT NULL DEFAULT 1 CHECK (importance BETWEEN 1 AND 5),
  PRIMARY KEY (job_role_id, skill_id)
);
CREATE TABLE IF NOT EXISTS student_skills (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_skills_user_skill_key UNIQUE (user_id, skill_id)
);
-- The existing student_profiles.career_goal remains the free-text vision;
-- this table stores the structured role used for deterministic gap analysis.
CREATE TABLE IF NOT EXISTS student_career_goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_career_goals_user_role_key UNIQUE (user_id, job_role_id),
  CONSTRAINT student_career_goals_one_role_per_user_key UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS skills_name_idx ON skills(name);
CREATE INDEX IF NOT EXISTS job_roles_title_idx ON job_roles(title);
CREATE INDEX IF NOT EXISTS job_role_skills_job_role_id_idx ON job_role_skills(job_role_id);
CREATE INDEX IF NOT EXISTS job_role_skills_skill_id_idx ON job_role_skills(skill_id);
CREATE INDEX IF NOT EXISTS student_skills_user_id_idx ON student_skills(user_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_id_idx ON student_skills(skill_id);

-- Student-owned chronological progress notes for individual skills.
CREATE TABLE IF NOT EXISTS student_skill_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  note TEXT NOT NULL CHECK (char_length(btrim(note)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_skill_notes_user_skill_created_idx ON student_skill_notes(user_id, skill_id, created_at DESC);

-- Stage 4: AI-generated, student-owned career guidance.  The deterministic
-- readiness score remains calculated by application code and is recorded here
-- only as a snapshot of the generation.
CREATE TABLE IF NOT EXISTS career_analyses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
  analysis JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS career_analyses_user_generated_idx ON career_analyses(user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS roadmaps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS roadmap_items (
  id BIGSERIAL PRIMARY KEY,
  roadmap_id BIGINT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number > 0),
  title TEXT NOT NULL,
  objective TEXT,
  reason TEXT,
  difficulty TEXT,
  project_idea TEXT,
  CONSTRAINT roadmap_items_roadmap_phase_key UNIQUE (roadmap_id, phase_number)
);
CREATE TABLE IF NOT EXISTS roadmap_item_skills (
  roadmap_item_id BIGINT NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  skill_id BIGINT REFERENCES skills(id) ON DELETE SET NULL,
  skill_name TEXT NOT NULL,
  PRIMARY KEY (roadmap_item_id, skill_name)
);
CREATE INDEX IF NOT EXISTS roadmaps_user_generated_idx ON roadmaps(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS roadmap_items_roadmap_id_idx ON roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS roadmap_item_skills_item_id_idx ON roadmap_item_skills(roadmap_item_id);
