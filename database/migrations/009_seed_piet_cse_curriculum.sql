-- JOB-LEARNER
-- Migration 009: PIET B.Tech Computer Science & Engineering Curriculum
--
-- Demo curriculum based on PIET CSE syllabus documents.
-- This is intentionally marked as DEMO because JOB-LEARNER
-- should not present imported syllabus data as independently verified.

BEGIN;

DO $$
DECLARE
  v_college_id BIGINT;
  v_branch_id BIGINT;
  v_curriculum_id BIGINT;
  v_semester_id BIGINT;
BEGIN

  -- ------------------------------------------------------------
  -- 1. Find PIET and Computer Science Engineering
  -- ------------------------------------------------------------

  SELECT id
  INTO v_college_id
  FROM colleges
  WHERE name = 'Panipat Institute of Engineering and Technology'
     OR name = 'PIET'
  ORDER BY id
  LIMIT 1;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'PIET college was not found in colleges table.';
  END IF;

  SELECT id
  INTO v_branch_id
  FROM branches
  WHERE name IN (
    'Computer Science Engineering',
    'Computer Science',
    'CSE'
  )
  ORDER BY id
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Computer Science Engineering branch was not found.';
  END IF;

  -- ------------------------------------------------------------
  -- 2. Create the curriculum if it does not already exist
  -- ------------------------------------------------------------

  SELECT id
  INTO v_curriculum_id
  FROM curricula
  WHERE college_id = v_college_id
    AND branch_id = v_branch_id
    AND curriculum_name = 'B.Tech Computer Science & Engineering (Hons.) - 2025-26'
  ORDER BY id DESC
  LIMIT 1;

  IF v_curriculum_id IS NULL THEN

    INSERT INTO curricula (
      college_id,
      branch_id,
      curriculum_name,
      regulation_version,
      description,
      academic_year,
      source_name,
      source_url,
      last_verified_at,
      verification_status
    )
    VALUES (
      v_college_id,
      v_branch_id,
      'B.Tech Computer Science & Engineering (Hons.) - 2025-26',
      'Academic Council 28.06.2025',
      'PIET B.Tech Computer Science & Engineering curriculum used for the JOB-LEARNER demonstration.',
      '2025-26',
      'PIET CSE syllabus documents',
      'https://www.piet.co.in/',
      NULL,
      'demo'
    )
    RETURNING id INTO v_curriculum_id;

  END IF;

  -- ============================================================
  -- SEMESTER 1
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 1)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 1;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'ASH-101', 'Engineering Mathematics-I', 4),
    (v_semester_id, 'ASH-103', 'Semiconductor & Quantum Physics', 4),
    (v_semester_id, 'CSE-101', 'Problem Solving using C', 3),
    (v_semester_id, 'ASH-105', 'Essentials of English Language', 3),
    (v_semester_id, 'ASH-107', 'Universal Human Values', 2),
    (v_semester_id, 'ME-151L', 'Design Thinking Lab', 1.5),
    (v_semester_id, 'ASH-153L', 'Semiconductor & Quantum Physics Lab', 1),
    (v_semester_id, 'CSE-151L', 'Problem Solving using C Lab', 1),
    (v_semester_id, 'ME-153L', 'Engineering Workshop', 1),
    (v_semester_id, 'ME-155L', 'IDEA Lab', 1)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 2
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 2)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 2;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'ASH-102', 'Engineering Mathematics-II', 4),
    (v_semester_id, 'CSE-102', 'Programming with Python', 3),
    (v_semester_id, 'ECE-102', 'Basics of Electrical and Electronics Engineering', 4),
    (v_semester_id, 'ASH-108', 'Engineering Chemistry', 4),
    (v_semester_id, 'ASH-106', 'Basics of Communication Skills', 2),
    (v_semester_id, 'CSE-152L', 'Programming with Python Lab', 1),
    (v_semester_id, 'ECE-152L', 'Basics of Electrical and Electronics Engineering Lab', 1),
    (v_semester_id, 'ASH-158L', 'Engineering Chemistry Lab', 1),
    (v_semester_id, 'ASH-156L', 'Basics of Communication Skills Lab', 1),
    (v_semester_id, 'ECE-154L', 'Internet of Things Lab', 1),
    (v_semester_id, 'ASH-109', 'Traditional Knowledge of India', 0)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 3
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 3)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 3;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'ASH-MAT-203A', 'Essential Mathematics for CSE', 4),
    (v_semester_id, 'BT-CE-102A', 'Environmental Science/Studies', 0),
    (v_semester_id, 'BT-ECE-221A', 'Digital System Design', 3),
    (v_semester_id, 'BT-ECE-275A', 'Digital System Design Lab', 2),
    (v_semester_id, 'BT-CSE-201A', 'DBMS', 3),
    (v_semester_id, 'BT-CSE-203A', 'Data Structures', 3),
    (v_semester_id, 'BT-CSE-205A', 'OOP', 3),
    (v_semester_id, 'BT-CSE-271A', 'DBMS Lab', 2),
    (v_semester_id, 'BT-CSE-273A', 'Data Structures Lab', 2),
    (v_semester_id, 'BT-CSE-275A', 'OOP Lab', 2),
    (v_semester_id, 'BT-CSE-277A', 'Summer Internship-I', 2)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 4
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 4)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 4;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'BT-ECE-202A', 'Microprocessor based System Design', 3),
    (v_semester_id, 'BT-ECE-272A', 'Microprocessor based System Design Lab', 1),
    (v_semester_id, 'BT-CSE-202A', 'Discrete Structures', 4),
    (v_semester_id, 'BT-CSE-204A', 'Computer Organization & Architecture', 3),
    (v_semester_id, 'BT-CSE-206A', 'Operating System', 3),
    (v_semester_id, 'BT-CSE-208A', 'Design & Analysis of Algorithms', 3),
    (v_semester_id, 'BT-CSE-276A', 'Operating Systems Lab', 2),
    (v_semester_id, 'BT-CSE-278A', 'Design & Analysis of Algorithms Lab', 2)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 5
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 5)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 5;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'ASH-HUM-210A', 'Indian Knowledge System: Concepts in Engineering', 2),
    (v_semester_id, 'BT-CSE-301A', 'Theory of Computation', 3),
    (v_semester_id, 'BT-CSE-303A', 'Fundamentals of Artificial Intelligence', 3),
    (v_semester_id, 'BT-CSE-305A', 'Software Engineering', 3),
    (v_semester_id, 'BT-CSE-307A', 'Fundamentals of Machine Learning', 3),
    (v_semester_id, 'BT-CSE-309A', 'Fundamentals of Cyber Security', 3),
    (v_semester_id, 'BT-CSE-375A', 'Software Engineering Lab', 2),
    (v_semester_id, 'BT-CSE-377A', 'Machine Learning Lab', 1),
    (v_semester_id, 'BT-CSE-379A', 'Summer Internship-II', 2)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 6
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 6)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 6;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'HS-BBA-376A', 'Business Intelligence & Entrepreneurship', 3),
    (v_semester_id, 'BT-CSE-302A', 'Compiler Design', 3),
    (v_semester_id, 'BT-CSE-304A', 'Computer Networks', 3),
    (v_semester_id, NULL, 'Open Elective-I', 3),
    (v_semester_id, NULL, 'Program Elective-I', 3),
    (v_semester_id, 'BT-CSE-376A', 'Project-1', 2),
    (v_semester_id, 'BT-CSE-374A', 'Computer Networks Lab', 2),
    (v_semester_id, NULL, 'Elective-I Lab', 2)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 7
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 7)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 7;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'BT-CSE-401A', 'Neural Networks and Deep Learning', 3),
    (v_semester_id, NULL, 'Program Elective-II', 3),
    (v_semester_id, NULL, 'Open Elective-II', 3),
    (v_semester_id, 'BT-CSE-481A', 'Project-II', 3),
    (v_semester_id, NULL, 'Program Elective-II Lab', 2),
    (v_semester_id, 'BT-CSE-471A', 'Neural Networks and Deep Learning Lab', 2),
    (v_semester_id, 'BT-CSE-473A', 'Summer Internship-III', 2)
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- SEMESTER 8
  -- ============================================================

  INSERT INTO semesters (curriculum_id, semester_number)
  VALUES (v_curriculum_id, 8)
  ON CONFLICT (curriculum_id, semester_number) DO NOTHING;

  SELECT id INTO v_semester_id
  FROM semesters
  WHERE curriculum_id = v_curriculum_id
    AND semester_number = 8;

  INSERT INTO subjects
    (semester_id, subject_code, subject_name, credits)
  VALUES
    (v_semester_id, 'BT-CSE-402A', 'Full Stack Development', 3),
    (v_semester_id, NULL, 'Elective-III', 3),
    (v_semester_id, NULL, 'Open Elective-III', 3),
    (v_semester_id, 'BT-CSE-472A', 'Full Stack Development Lab', 2),
    (v_semester_id, 'BT-CSE-474A', 'Project-III', 3),
    (v_semester_id, 'BT-CSE-476A', 'Seminar', 1)
  ON CONFLICT DO NOTHING;

END $$;

COMMIT;