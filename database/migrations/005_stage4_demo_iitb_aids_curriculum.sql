-- Stage 4 DEMO/TEST data only. This is not an official IIT Bombay curriculum.
-- It resolves the existing college and branch by name and can be safely re-run.

INSERT INTO curricula (college_id, branch_id, curriculum_name, regulation_version, description)
SELECT c.id, b.id,
  'AI/Data Science Undergraduate Curriculum - Demo',
  'STAGE4-DEMO-2026',
  'DEMO/TEST DATA ONLY for JOB-LEARNER Stage 4. This is not an official IIT Bombay curriculum.'
FROM colleges c
JOIN branches b ON b.name = 'Artificial Intelligence / Data Science'
WHERE c.name = 'Indian Institute of Technology Bombay'
  AND NOT EXISTS (
    SELECT 1 FROM curricula cu
    WHERE cu.college_id = c.id
      AND cu.branch_id = b.id
      AND cu.curriculum_name = 'AI/Data Science Undergraduate Curriculum - Demo'
      AND cu.regulation_version = 'STAGE4-DEMO-2026'
  );

INSERT INTO semesters (curriculum_id, semester_number)
SELECT cu.id, v.semester_number
FROM curricula cu
JOIN colleges c ON c.id = cu.college_id
JOIN branches b ON b.id = cu.branch_id
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS v(semester_number)
WHERE c.name = 'Indian Institute of Technology Bombay'
  AND b.name = 'Artificial Intelligence / Data Science'
  AND cu.curriculum_name = 'AI/Data Science Undergraduate Curriculum - Demo'
  AND cu.regulation_version = 'STAGE4-DEMO-2026'
  AND NOT EXISTS (
    SELECT 1 FROM semesters sem
    WHERE sem.curriculum_id = cu.id AND sem.semester_number = v.semester_number
  );

INSERT INTO subjects (semester_id, subject_code, subject_name, credits, description)
SELECT sem.id, v.subject_code, v.subject_name, v.credits, v.description
FROM curricula cu
JOIN colleges c ON c.id = cu.college_id
JOIN branches b ON b.id = cu.branch_id
JOIN semesters sem ON sem.curriculum_id = cu.id
JOIN (VALUES
  (1, 'AIDS101', 'Mathematics I', 4.0, 'Calculus and foundational mathematical methods for engineering.'),
  (1, 'AIDS102', 'Programming Fundamentals', 4.0, 'Problem solving, programming constructs, and computational thinking.'),
  (1, 'AIDS103', 'Engineering Physics', 3.0, 'Physics principles relevant to engineering systems.'),
  (1, 'AIDS104', 'Engineering Chemistry', 3.0, 'Chemical principles and materials foundations for engineers.'),
  (1, 'AIDS105', 'Communication Skills', 2.0, 'Technical writing, presentations, and collaborative communication.'),
  (2, 'AIDS201', 'Mathematics II', 4.0, 'Differential equations, transforms, and applied mathematics.'),
  (2, 'AIDS202', 'Data Structures', 4.0, 'Core data structures and algorithmic problem solving.'),
  (2, 'AIDS203', 'Object Oriented Programming', 3.0, 'Object-oriented design, implementation, and testing.'),
  (2, 'AIDS204', 'Digital Logic', 3.0, 'Boolean algebra, combinational logic, and sequential circuits.'),
  (2, 'AIDS205', 'Probability and Statistics', 4.0, 'Probability models, statistical inference, and data analysis.'),
  (3, 'AIDS301', 'Database Management Systems', 4.0, 'Relational modeling, SQL, transactions, and database design.'),
  (3, 'AIDS302', 'Computer Organization', 3.0, 'Processor organization, memory hierarchy, and instruction execution.'),
  (3, 'AIDS303', 'Operating Systems', 4.0, 'Processes, memory, file systems, and operating-system concepts.'),
  (3, 'AIDS304', 'Linear Algebra', 4.0, 'Vectors, matrices, eigenvalues, and applications in data science.'),
  (3, 'AIDS305', 'Introduction to Artificial Intelligence', 3.0, 'Search, knowledge representation, reasoning, and intelligent agents.'),
  (4, 'AIDS401', 'Computer Networks', 3.0, 'Network architectures, protocols, and reliable communication.'),
  (4, 'AIDS402', 'Machine Learning', 4.0, 'Supervised and unsupervised learning methods and evaluation.'),
  (4, 'AIDS403', 'Data Mining', 3.0, 'Pattern discovery, clustering, association analysis, and data preparation.'),
  (4, 'AIDS404', 'Software Engineering', 3.0, 'Requirements, design, testing, and maintainable software delivery.'),
  (4, 'AIDS405', 'Optimization Techniques', 3.0, 'Optimization models and methods for computational decision making.'),
  (5, 'AIDS501', 'Deep Learning', 4.0, 'Neural networks, representation learning, and deep-learning practice.'),
  (5, 'AIDS502', 'Natural Language Processing', 3.0, 'Methods for processing, modeling, and evaluating human language.'),
  (5, 'AIDS503', 'Computer Vision', 3.0, 'Image analysis, visual recognition, and vision-model foundations.'),
  (5, 'AIDS504', 'Big Data Analytics', 3.0, 'Scalable data processing and analytics workflows.'),
  (5, 'AIDS505', 'Web Technologies', 3.0, 'Web application foundations, client-server concepts, and APIs.'),
  (6, 'AIDS601', 'Reinforcement Learning', 3.0, 'Sequential decision making, value methods, and policy learning.'),
  (6, 'AIDS602', 'Cloud Computing', 3.0, 'Cloud service models, deployment concepts, and scalable computing.'),
  (6, 'AIDS603', 'MLOps', 3.0, 'Model lifecycle, reproducibility, deployment, and monitoring practices.'),
  (6, 'AIDS604', 'Distributed Systems', 3.0, 'Distributed computing principles, coordination, and fault tolerance.'),
  (6, 'AIDS605', 'Information Security', 3.0, 'Security principles, secure system design, and risk awareness.'),
  (7, 'AIDS701', 'Advanced Machine Learning', 4.0, 'Advanced learning methods, model selection, and research practice.'),
  (7, 'AIDS702', 'Generative AI', 3.0, 'Generative modeling concepts, applications, and responsible use.'),
  (7, 'AIDS703', 'AI Ethics and Responsible AI', 3.0, 'Fairness, accountability, transparency, and responsible AI practice.'),
  (7, 'AIDS704', 'Elective / Specialization', 3.0, 'Student-selected advanced topic in AI or data science.'),
  (7, 'AIDS705', 'Major Project I', 4.0, 'First phase of a supervised capstone or research project.'),
  (8, 'AIDS801', 'AI Capstone Project', 4.0, 'End-to-end AI/data science project addressing a practical problem.'),
  (8, 'AIDS802', 'Industry Internship / Project', 4.0, 'Structured industry, research, or applied project experience.'),
  (8, 'AIDS803', 'AI Systems Design', 3.0, 'Design of reliable, scalable AI-enabled software systems.'),
  (8, 'AIDS804', 'Technical Seminar', 2.0, 'Technical literature review, presentation, and professional discussion.'),
  (8, 'AIDS805', 'Major Project II', 4.0, 'Completion, evaluation, and presentation of the major project.')
) AS v(semester_number, subject_code, subject_name, credits, description)
  ON v.semester_number = sem.semester_number
WHERE c.name = 'Indian Institute of Technology Bombay'
  AND b.name = 'Artificial Intelligence / Data Science'
  AND cu.curriculum_name = 'AI/Data Science Undergraduate Curriculum - Demo'
  AND cu.regulation_version = 'STAGE4-DEMO-2026'
  AND NOT EXISTS (
    SELECT 1 FROM subjects sub
    WHERE sub.semester_id = sem.id AND sub.subject_code = v.subject_code
  );
