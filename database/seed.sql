-- Safe to re-run: unique constraints avoid duplicate branches and colleges.
INSERT INTO branches (name, code)
SELECT v.name, v.code
FROM (VALUES
  ('Computer Science Engineering', 'CSE'), ('Information Technology', NULL),
  ('Electronics and Communication Engineering', 'ECE'), ('Electrical Engineering', NULL),
  ('Mechanical Engineering', NULL), ('Civil Engineering', NULL),
  ('Artificial Intelligence / Data Science', 'AIDS')
) AS v(name, code)
WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.name = v.name);

INSERT INTO colleges (name, city, state, university, website)
SELECT v.name, v.city, v.state, v.university, v.website
FROM (VALUES
  ('Indian Institute of Technology Bombay', 'Mumbai', 'Maharashtra', 'IIT Bombay', 'https://www.iitb.ac.in'),
  ('COEP Technological University', 'Pune', 'Maharashtra', 'COEP Tech', 'https://www.coeptech.ac.in'),
  ('Indian Institute of Technology Madras', 'Chennai', 'Tamil Nadu', 'IIT Madras', 'https://www.iitm.ac.in'),
  ('Delhi Technological University', 'New Delhi', 'Delhi', 'Delhi Technological University', 'https://dtu.ac.in'),
  ('National Institute of Technology Tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', 'NIT Tiruchirappalli', 'https://www.nitt.edu'),
  ('Manipal Institute of Technology', 'Manipal', 'Karnataka', 'Manipal Academy of Higher Education', 'https://manipal.edu'),
  ('Vellore Institute of Technology', 'Vellore', 'Tamil Nadu', 'VIT', 'https://vit.ac.in')
) AS v(name, city, state, university, website)
WHERE NOT EXISTS (SELECT 1 FROM colleges c WHERE c.name = v.name AND c.city = v.city);

INSERT INTO college_branches (college_id, branch_id)
SELECT c.id, b.id FROM colleges c CROSS JOIN branches b
WHERE (c.name IN ('Indian Institute of Technology Bombay', 'COEP Technological University') AND b.name IN ('Computer Science Engineering', 'Information Technology', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'))
   OR (c.name IN ('Indian Institute of Technology Madras', 'National Institute of Technology Tiruchirappalli') AND b.name IN ('Computer Science Engineering', 'Electronics and Communication Engineering', 'Electrical Engineering'))
   OR (c.name IN ('Delhi Technological University', 'Vellore Institute of Technology', 'Manipal Institute of Technology') AND b.name IN ('Computer Science Engineering', 'Information Technology', 'Artificial Intelligence / Data Science'))
ON CONFLICT DO NOTHING;

-- Stage 3 skills and deterministic job-role requirements.
INSERT INTO skills (name, category, description) VALUES
  ('HTML', 'Frontend', 'Semantic web page structure.'), ('CSS', 'Frontend', 'Responsive visual styling.'),
  ('JavaScript', 'Programming', 'Browser and server-side programming.'), ('TypeScript', 'Programming', 'Typed JavaScript development.'),
  ('React', 'Frontend', 'Component-based user interfaces.'), ('Next.js', 'Frontend', 'React full-stack framework.'),
  ('Node.js', 'Backend', 'JavaScript runtime for servers.'), ('Python', 'Programming', 'General-purpose programming language.'),
  ('Java', 'Programming', 'Object-oriented programming language.'), ('SQL', 'Data', 'Relational data querying.'),
  ('PostgreSQL', 'Data', 'Relational database administration and design.'), ('Git', 'Tools', 'Version control.'),
  ('GitHub', 'Tools', 'Collaborative code hosting.'), ('REST APIs', 'Backend', 'HTTP API design and integration.'),
  ('Data Structures', 'Computer Science', 'Core data organization techniques.'), ('Algorithms', 'Computer Science', 'Problem-solving algorithms.'),
  ('Machine Learning', 'AI', 'Predictive model development.'), ('Communication', 'Professional', 'Clear written and verbal collaboration.'),
  ('Problem Solving', 'Professional', 'Structured analytical thinking.'), ('Docker', 'DevOps', 'Containerized application delivery.'),
  ('Cloud Platforms', 'Cloud', 'Cloud infrastructure and services.'), ('Linux', 'DevOps', 'Linux systems operation.'),
  ('Cybersecurity', 'Security', 'Secure systems and threat awareness.'), ('Networking', 'Security', 'Network fundamentals and protocols.'), ('Mobile Development', 'Mobile', 'Mobile application development.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO job_roles (title, description, category) VALUES
  ('Frontend Developer', 'Builds accessible, responsive web interfaces.', 'Software Development'),
  ('Backend Developer', 'Builds reliable server-side applications and APIs.', 'Software Development'),
  ('Full Stack Developer', 'Builds features across frontend and backend.', 'Software Development'),
  ('Software Engineer', 'Designs and delivers maintainable software systems.', 'Software Development'),
  ('Data Analyst', 'Turns data into useful reports and insights.', 'Data'),
  ('Data Scientist', 'Uses data, statistics, and models to solve problems.', 'Data'),
  ('Machine Learning Engineer', 'Productionizes machine learning systems.', 'AI'),
  ('AI Engineer', 'Builds applications powered by AI and machine learning.', 'AI'),
  ('DevOps Engineer', 'Automates delivery and infrastructure operations.', 'Infrastructure'),
  ('Cloud Engineer', 'Designs and operates cloud infrastructure.', 'Infrastructure'),
  ('Cybersecurity Analyst', 'Monitors and improves organizational security.', 'Security'),
  ('Mobile App Developer', 'Builds mobile applications and experiences.', 'Software Development')
ON CONFLICT (title) DO NOTHING;

INSERT INTO job_role_skills (job_role_id, skill_id, required_level, importance)
SELECT r.id, s.id, m.required_level, m.importance
FROM (VALUES
  ('Frontend Developer','HTML',4,5),('Frontend Developer','CSS',4,5),('Frontend Developer','JavaScript',4,5),('Frontend Developer','TypeScript',3,4),('Frontend Developer','React',4,5),('Frontend Developer','Next.js',3,4),('Frontend Developer','Git',3,3),('Frontend Developer','REST APIs',3,3),
  ('Backend Developer','JavaScript',3,4),('Backend Developer','TypeScript',3,3),('Backend Developer','Node.js',4,5),('Backend Developer','REST APIs',4,5),('Backend Developer','SQL',4,5),('Backend Developer','PostgreSQL',4,4),('Backend Developer','Git',3,3),('Backend Developer','Data Structures',4,4),('Backend Developer','Algorithms',4,4),
  ('Full Stack Developer','HTML',3,4),('Full Stack Developer','CSS',3,3),('Full Stack Developer','JavaScript',4,5),('Full Stack Developer','TypeScript',3,4),('Full Stack Developer','React',4,5),('Full Stack Developer','Node.js',4,5),('Full Stack Developer','SQL',3,4),('Full Stack Developer','REST APIs',4,4),('Full Stack Developer','Git',3,3),
  ('Software Engineer','Java',3,3),('Software Engineer','Python',3,3),('Software Engineer','Git',3,3),('Software Engineer','Data Structures',4,5),('Software Engineer','Algorithms',4,5),('Software Engineer','Problem Solving',4,5),('Software Engineer','Communication',3,3),
  ('Data Analyst','SQL',4,5),('Data Analyst','PostgreSQL',3,3),('Data Analyst','Python',3,4),('Data Analyst','Communication',4,4),('Data Analyst','Problem Solving',4,5),
  ('Data Scientist','Python',4,5),('Data Scientist','SQL',4,4),('Data Scientist','PostgreSQL',3,3),('Data Scientist','Machine Learning',4,5),('Data Scientist','Algorithms',3,3),('Data Scientist','Problem Solving',4,5),
  ('Machine Learning Engineer','Python',4,5),('Machine Learning Engineer','Machine Learning',5,5),('Machine Learning Engineer','SQL',3,3),('Machine Learning Engineer','Docker',3,4),('Machine Learning Engineer','Git',3,3),('Machine Learning Engineer','Algorithms',4,4),
  ('AI Engineer','Python',4,5),('AI Engineer','Machine Learning',4,5),('AI Engineer','REST APIs',3,3),('AI Engineer','Docker',3,3),('AI Engineer','Problem Solving',4,4),
  ('DevOps Engineer','Linux',4,5),('DevOps Engineer','Docker',4,5),('DevOps Engineer','Cloud Platforms',4,5),('DevOps Engineer','Git',4,4),('DevOps Engineer','Node.js',2,2),('DevOps Engineer','Problem Solving',4,4),
  ('Cloud Engineer','Cloud Platforms',5,5),('Cloud Engineer','Linux',4,4),('Cloud Engineer','Docker',3,4),('Cloud Engineer','Git',3,3),('Cloud Engineer','REST APIs',3,3),
  ('Cybersecurity Analyst','Cybersecurity',5,5),('Cybersecurity Analyst','Linux',3,4),('Cybersecurity Analyst','Python',3,3),('Cybersecurity Analyst','Networking',3,3),('Cybersecurity Analyst','Problem Solving',4,4),
  ('Mobile App Developer','Mobile Development',5,5),('Mobile App Developer','Java',3,3),('Mobile App Developer','REST APIs',3,4),('Mobile App Developer','Git',3,3),('Mobile App Developer','Problem Solving',4,4)
) AS m(role_title, skill_name, required_level, importance)
JOIN job_roles r ON r.title = m.role_title
JOIN skills s ON s.name = m.skill_name
ON CONFLICT (job_role_id, skill_id) DO NOTHING;

INSERT INTO curricula (college_id, branch_id, curriculum_name, regulation_version, description, source_name, verification_status)
SELECT c.id, b.id, 'Bachelor of Technology Curriculum', '2025', 'Sample curriculum for Stage 2 demonstration.', 'JOB-LEARNER demo data', 'demo' FROM colleges c JOIN branches b ON b.name = 'Computer Science Engineering' WHERE c.name IN ('Indian Institute of Technology Bombay', 'COEP Technological University')
ON CONFLICT DO NOTHING;
INSERT INTO semesters (curriculum_id, semester_number)
SELECT id, n FROM curricula CROSS JOIN (VALUES (1), (2)) AS numbers(n) WHERE regulation_version = '2025'
ON CONFLICT DO NOTHING;
INSERT INTO subjects (semester_id, subject_code, subject_name, credits, description)
SELECT s.id, v.code, v.name, v.credits, v.description FROM semesters s JOIN curricula c ON c.id = s.curriculum_id CROSS JOIN (VALUES
  (1, 'CS101', 'Programming for Problem Solving', 4.0, 'Fundamentals of programming and computational thinking.'),
  (1, 'MA101', 'Engineering Mathematics I', 4.0, 'Calculus, linear algebra, and applications.'),
  (1, 'PH101', 'Engineering Physics', 3.0, 'Physics foundations for engineers.'),
  (1, 'EG101', 'Engineering Graphics', 2.0, 'Technical drawing and visual communication.'),
  (2, 'CS201', 'Data Structures', 4.0, 'Core data structures and algorithms.'),
  (2, 'CS202', 'Digital Logic', 3.0, 'Digital systems and logic design.'),
  (2, 'CS203', 'Database Systems', 4.0, 'Relational databases and SQL.'),
  (2, 'MA201', 'Discrete Mathematics', 3.0, 'Logic, graphs, and combinatorics.')
) AS v(semester_number, code, name, credits, description) WHERE c.regulation_version = '2025' AND s.semester_number = v.semester_number
ON CONFLICT DO NOTHING;
