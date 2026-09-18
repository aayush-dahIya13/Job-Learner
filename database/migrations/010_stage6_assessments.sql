-- Stage 6: Student Diagnostic Assessment Engine Schema & Seed Migration

-- 1. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  job_role_id BIGINT REFERENCES job_roles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assessment_type VARCHAR(50) NOT NULL DEFAULT 'diagnostic' CHECK (assessment_type IN ('diagnostic', 'topic', 'milestone', 'reassessment', 'company_screening')),
  duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (duration_minutes > 0),
  total_questions INTEGER NOT NULL DEFAULT 0,
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Assessment Questions Table
CREATE TABLE IF NOT EXISTS assessment_questions (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_type VARCHAR(30) NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'multiple_select', 'code_output', 'debugging')),
  question_text TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  explanation TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Question Options Table
CREATE TABLE IF NOT EXISTS assessment_question_options (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL DEFAULT 1,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  percentage NUMERIC(5,2),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assessment Answers Table
CREATE TABLE IF NOT EXISTS assessment_answers (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_option_id BIGINT REFERENCES assessment_question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assessment_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);

-- 6. Skill Assessment Results Table
CREATE TABLE IF NOT EXISTS skill_assessment_results (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  demonstrated_level INTEGER NOT NULL DEFAULT 1 CHECK (demonstrated_level BETWEEN 1 AND 5),
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT skill_assessment_results_attempt_skill_key UNIQUE (attempt_id, skill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS assessments_job_role_id_idx ON assessments(job_role_id);
CREATE INDEX IF NOT EXISTS assessment_questions_assessment_id_idx ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS assessment_questions_skill_id_idx ON assessment_questions(skill_id);
CREATE INDEX IF NOT EXISTS assessment_question_options_question_id_idx ON assessment_question_options(question_id);
CREATE INDEX IF NOT EXISTS assessment_attempts_user_id_idx ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS assessment_attempts_assessment_id_idx ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS assessment_answers_attempt_id_idx ON assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS skill_assessment_results_user_id_idx ON skill_assessment_results(user_id);
CREATE INDEX IF NOT EXISTS skill_assessment_results_attempt_id_idx ON skill_assessment_results(attempt_id);

-- SEED INITIAL FULL STACK DEVELOPER DIAGNOSTIC ASSESSMENT
DO $$
DECLARE
  v_job_role_id BIGINT;
  v_assessment_id BIGINT;
  v_q_id BIGINT;
  v_skill_html BIGINT;
  v_skill_css BIGINT;
  v_skill_js BIGINT;
  v_skill_react BIGINT;
  v_skill_node BIGINT;
  v_skill_rest BIGINT;
  v_skill_sql BIGINT;
  v_skill_git BIGINT;
  v_skill_ts BIGINT;
BEGIN
  -- Get Job Role ID
  SELECT id INTO v_job_role_id FROM job_roles WHERE title = 'Full Stack Developer' LIMIT 1;
  IF v_job_role_id IS NULL THEN
    RETURN;
  END IF;

  -- Get Skill IDs
  SELECT id INTO v_skill_html FROM skills WHERE name = 'HTML' LIMIT 1;
  SELECT id INTO v_skill_css FROM skills WHERE name = 'CSS' LIMIT 1;
  SELECT id INTO v_skill_js FROM skills WHERE name = 'JavaScript' LIMIT 1;
  SELECT id INTO v_skill_react FROM skills WHERE name = 'React' LIMIT 1;
  SELECT id INTO v_skill_node FROM skills WHERE name = 'Node.js' LIMIT 1;
  SELECT id INTO v_skill_rest FROM skills WHERE name = 'REST APIs' LIMIT 1;
  SELECT id INTO v_skill_sql FROM skills WHERE name = 'SQL' LIMIT 1;
  SELECT id INTO v_skill_git FROM skills WHERE name = 'Git' LIMIT 1;
  SELECT id INTO v_skill_ts FROM skills WHERE name = 'TypeScript' LIMIT 1;

  -- Create Assessment if not exists
  SELECT id INTO v_assessment_id FROM assessments WHERE job_role_id = v_job_role_id AND assessment_type = 'diagnostic' LIMIT 1;

  IF v_assessment_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Full Stack Developer Diagnostic Assessment',
      'An objective, scenario-based evaluation measuring demonstrated proficiency across core full-stack web development competencies.',
      'diagnostic',
      45,
      23,
      70,
      1,
      'active'
    ) RETURNING id INTO v_assessment_id;

    -- =========================================================================
    -- HTML QUESTIONS (2)
    -- =========================================================================
    -- Q1: HTML Semantic Navigation
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_html, 'mcq',
      'You are auditing a complex web application for accessibility (a11y). Which HTML structure correctly represents the primary site navigation landmark for screen readers?',
      'beginner', 1,
      'The <nav> element defines a major navigation block. Using <nav aria-label="Main Navigation"><ul><li><a href="...">Home</a></li></ul></nav> creates an accessible navigation landmark landmark.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '<div class="navigation"><span onclick="location.href=''/home''">Home</span></div>', 1, FALSE),
      (v_q_id, '<nav aria-label="Main Navigation"><ul><li><a href="/home">Home</a></li></ul></nav>', 2, TRUE),
      (v_q_id, '<header><section id="nav"><button href="/home">Home</button></section></header>', 3, FALSE),
      (v_q_id, '<menu type="toolbar"><li><div href="/home">Home</div></li></menu>', 4, FALSE);

    -- Q2: HTML Form Validation & Accessibility
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_html, 'mcq',
      'A user submits a form without filling out a required email field. Which combination of attributes ensures both browser-native client-side validation and screen reader error announcements?',
      'intermediate', 1,
      'The required attribute triggers native browser validation, type="email" enforces valid email syntax, and aria-describedby links the input to an accessible error message div.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '<input type="text" name="email" placeholder="Required email" />', 1, FALSE),
      (v_q_id, '<input type="email" name="email" required aria-describedby="email-error" />', 2, TRUE),
      (v_q_id, '<input type="string" name="email" validate="true" data-required="1" />', 3, FALSE),
      (v_q_id, '<input type="text" id="email" class="mandatory-field" />', 4, FALSE);

    -- =========================================================================
    -- CSS QUESTIONS (2)
    -- =========================================================================
    -- Q3: CSS Flexbox / Layout behavior
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_css, 'mcq',
      'Given a flex container with `display: flex; width: 600px;`, containing two items: Child A (`flex: 1 1 400px`) and Child B (`flex: 2 1 400px`). What will be the final rendered width of Child A?',
      'intermediate', 1,
      'Total flex-basis = 400px + 400px = 800px. Available width = 600px. Total shrink deficit = 200px. Both items have flex-shrink = 1 and flex-basis = 400px, so shrink is shared equally (100px each). Child A width = 400px - 100px = 300px.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '400px', 1, FALSE),
      (v_q_id, '300px', 2, TRUE),
      (v_q_id, '200px', 3, FALSE),
      (v_q_id, '150px', 4, FALSE);

    -- Q4: CSS Specificity Precedence
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_css, 'mcq',
      'Consider the following CSS rules applied to `<button id="submit-btn" class="btn primary">Submit</button>`:\n1. `#submit-btn { color: red; }` \n2. `button.btn.primary { color: blue !important; }` \n3. `button#submit-btn { color: green; }` \nWhich color will the button text display?',
      'intermediate', 1,
      'Although ID selectors have higher specificity (1,0,0 or 1,0,1), the `!important` declaration overrides all normal specificity rules regardless of selector type.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'red', 1, FALSE),
      (v_q_id, 'green', 2, FALSE),
      (v_q_id, 'blue', 3, TRUE),
      (v_q_id, 'black (default browser color due to conflict)', 4, FALSE);

    -- =========================================================================
    -- JAVASCRIPT QUESTIONS (3)
    -- =========================================================================
    -- Q5: JS Closures & Event Loop / Output Prediction
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_js, 'code_output',
      'What is logged to the console when the following JavaScript code executes?\n\n```js\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}\nfor (let j = 0; j < 3; j++) {\n  setTimeout(() => console.log(j), 0);\n}\n```',
      'intermediate', 1,
      '`var` is function-scoped, so all callbacks in the first loop reference the same mutated `i` variable (which reaches 3 after the loop). `let` is block-scoped, creating a fresh binding for `j` in each iteration. Output is 3, 3, 3, 0, 1, 2.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '0, 1, 2, 0, 1, 2', 1, FALSE),
      (v_q_id, '3, 3, 3, 0, 1, 2', 2, TRUE),
      (v_q_id, '0, 1, 2, 3, 3, 3', 3, FALSE),
      (v_q_id, '3, 3, 3, 3, 3, 3', 4, FALSE);

    -- Q6: JS Event Loop & Promise Microtasks Execution Order
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_js, 'code_output',
      'In what order will the numbers be printed?\n\n```js\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nqueueMicrotask(() => console.log(4));\nconsole.log(5);\n```',
      'intermediate', 1,
      'Synchronous logs run first (1, 5). Microtasks (Promise .then and queueMicrotask) run before macrotasks (setTimeout). Thus: 1, 5, 3, 4, 2.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '1, 2, 3, 4, 5', 1, FALSE),
      (v_q_id, '1, 5, 3, 4, 2', 2, TRUE),
      (v_q_id, '1, 5, 2, 3, 4', 3, FALSE),
      (v_q_id, '1, 3, 4, 5, 2', 4, FALSE);

    -- Q7: Object Immutability & Reference Mutation Debugging
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_js, 'debugging',
      'A developer attempts to create an immutable copy of a nested user profile object:\n\n```js\nconst user = { name: "Alex", settings: { theme: "dark" } };\nconst updatedUser = { ...user, name: "Jordan" };\nupdatedUser.settings.theme = "light";\n```\n\nWhat is the state of `user.settings.theme` after this code runs?',
      'intermediate', 1,
      'Object spread (`{ ...user }`) creates a shallow copy. Nested objects like `settings` are copied by reference. Modifying `updatedUser.settings.theme` directly mutates `user.settings.theme` to `"light"`.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '"dark"', 1, FALSE),
      (v_q_id, '"light"', 2, TRUE),
      (v_q_id, 'undefined', 3, FALSE),
      (v_q_id, 'TypeError: Cannot assign to read only property', 4, FALSE);

    -- =========================================================================
    -- REACT QUESTIONS (3)
    -- =========================================================================
    -- Q8: React useEffect dependency cycle & stale closure
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_react, 'debugging',
      'The following React component is intended to increment a counter every second:\n\n```jsx\nfunction Timer() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => {\n      setCount(count + 1);\n    }, 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <h1>{count}</h1>;\n}\n```\n\nWhat will happen on screen after 5 seconds?',
      'intermediate', 1,
      'Because `count` is captured in the closure of the effect with an empty dependency array `[]`, `count` inside `setCount(count + 1)` is always `0`. The rendered output stays stuck at `1`. Using `setCount(prev => prev + 1)` fixes the bug.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'The heading displays 5', 1, FALSE),
      (v_q_id, 'The heading displays 1 and stops incrementing', 2, TRUE),
      (v_q_id, 'The component crashes with a re-render limit exceeded error', 3, FALSE),
      (v_q_id, 'The heading displays 0', 4, FALSE);

    -- Q9: React State Batching & Functional Updaters
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_react, 'code_output',
      'Given this click handler in a React 18 component:\n\n```jsx\nconst [value, setValue] = useState(10);\nconst handleClick = () => {\n  setValue(value + 5);\n  setValue((prev) => prev * 2);\n  setValue(value + 10);\n};\n```\n\nIf `value` is initially 10, what is the new value of `value` after `handleClick` runs?',
      'advanced', 1,
      'React batches updates. First update sets value to 10+5=15. Second functional update receives prev=15 and returns 15*2=30. Third update `setValue(value + 10)` uses captured `value=10`, producing 10+10=20. Final state is 20.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '40', 1, FALSE),
      (v_q_id, '30', 2, FALSE),
      (v_q_id, '20', 3, TRUE),
      (v_q_id, '25', 4, FALSE);

    -- Q10: React Keys & DOM Reconciliation
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_react, 'mcq',
      'Why is using array index as a `key` prop (e.g. `items.map((item, index) => <ListItem key={index} ... />)`) dangerous when list items can be reordered or deleted?',
      'intermediate', 1,
      'React uses `key` to identify component instances across renders. When items are reordered or prepended, using index as key causes React to re-use state of existing components at that position, causing UI state bugs in inputs/uncontrolled components.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'It causes a fatal JavaScript error when rendering in production', 1, FALSE),
      (v_q_id, 'React misidentifies list component instances, causing local component state to persist on wrong items when items are reordered or removed', 2, TRUE),
      (v_q_id, 'It prevents CSS styles from being applied to child items', 3, FALSE),
      (v_q_id, 'It disables asynchronous rendering for the entire application tree', 4, FALSE);

    -- =========================================================================
    -- NODE.JS QUESTIONS (3)
    -- =========================================================================
    -- Q11: Node.js Event Loop & Unhandled Rejections in Middleware
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_node, 'debugging',
      'In Express.js (v4), an async route handler throws an uncaught error:\n\n```js\napp.get("/user", async (req, res) => {\n  const user = await fetchUserFromDb(req.query.id); // throws DB error\n  res.json(user);\n});\n```\n\nWhat happens when a request hits this endpoint if no try/catch or async wrapper is used?',
      'intermediate', 1,
      'In Express 4, rejected promises in async route handlers are not passed to error-handling middleware automatically. The request hangs until client timeout, and an UnhandledPromiseRejection Warning/Crash occurs.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Express catches it automatically and returns HTTP 500 Internal Server Error', 1, FALSE),
      (v_q_id, 'The HTTP request hangs indefinitely until timeout, and Node logs an unhandled promise rejection', 2, TRUE),
      (v_q_id, 'Node.js immediately restarts the server process without logging anything', 3, FALSE),
      (v_q_id, 'Express returns HTTP 404 Not Found to the client', 4, FALSE);

    -- Q12: Node.js Streams & Backpressure
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_node, 'mcq',
      'What problem does "backpressure" solve in Node.js Stream processing when piping data from a fast Readable stream to a slow Writable stream?',
      'advanced', 1,
      'Backpressure prevents memory exhaustion (OOM) by signaling the readable stream to pause reading when the writable stream internal buffer fills up.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'It automatically compresses data streams over TLS connections', 1, FALSE),
      (v_q_id, 'It prevents memory buffer overflow by pausing data read operations when the destination stream buffer reaches highWaterMark', 2, TRUE),
      (v_q_id, 'It encrypts payload chunks before writing to disk', 3, FALSE),
      (v_q_id, 'It forces synchronous execution of stream event listeners', 4, FALSE);

    -- Q13: Node.js Event Loop Phases & process.nextTick vs setImmediate
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_node, 'code_output',
      'What will be logged first when executing this script in Node.js?\n\n```js\nsetImmediate(() => console.log("immediate"));\nprocess.nextTick(() => console.log("nextTick"));\n```',
      'intermediate', 1,
      '`process.nextTick` callbacks are executed immediately after the current operation completes, before the event loop continues to any phase (including the check phase for `setImmediate`). Output is "nextTick".'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '"immediate"', 1, FALSE),
      (v_q_id, '"nextTick"', 2, TRUE),
      (v_q_id, 'The order is random depending on OS thread scheduling', 3, FALSE),
      (v_q_id, 'Both are logged simultaneously in parallel worker threads', 4, FALSE);

    -- =========================================================================
    -- REST APIS QUESTIONS (2)
    -- =========================================================================
    -- Q14: REST Semantics & Idempotency
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_rest, 'mcq',
      'Which HTTP method combination represents operations that are BOTH idempotent according to REST standards?',
      'intermediate', 1,
      'PUT (replacing a resource) and DELETE (removing a resource) are idempotent: repeating the request multiple times produces the same server state as executing it once. POST is non-idempotent.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'POST and PATCH', 1, FALSE),
      (v_q_id, 'PUT and DELETE', 2, TRUE),
      (v_q_id, 'POST and PUT', 3, FALSE),
      (v_q_id, 'POST and DELETE', 4, FALSE);

    -- Q15: CORS Mechanics & Preflight Requests
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_rest, 'mcq',
      'A web application at `https://app.example.com` makes a cross-origin `POST` request to `https://api.example.com/data` with header `Content-Type: application/json` and custom header `X-App-Version: 2.0`. Why does the browser send an HTTP `OPTIONS` request before the `POST` request?',
      'intermediate', 1,
      'Custom headers like `X-App-Version` make the HTTP request "non-simple", requiring a CORS preflight `OPTIONS` request so the browser can verify if the server permits the custom header via `Access-Control-Allow-Headers`.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Because POST requests are not supported across origins without TLS 1.3', 1, FALSE),
      (v_q_id, 'The custom header `X-App-Version` triggers a CORS preflight OPTIONS check to verify server permission before sending actual data', 2, TRUE),
      (v_q_id, 'To negotiate JSON compression algorithms between client and server', 3, FALSE),
      (v_q_id, 'Because cross-subdomain requests automatically require basic authentication', 4, FALSE);

    -- =========================================================================
    -- SQL QUESTIONS (3)
    -- =========================================================================
    -- Q16: SQL Joins & NULL Aggregation Behavior
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_sql, 'code_output',
      'Consider tables `students` (3 rows) and `enrollments` (2 rows matched to student 1, 0 for student 2 & 3). What is the row count returned by:\n\n```sql\nSELECT s.id, COUNT(e.id) \nFROM students s \nLEFT JOIN enrollments e ON s.id = e.student_id \nGROUP BY s.id;\n```',
      'intermediate', 1,
      'A LEFT JOIN preserves all 3 student rows. For student 1, COUNT(e.id) is 2. For students 2 and 3, `e.id` is NULL, so `COUNT(e.id)` returns 0. The output contains exactly 3 rows.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '1 row', 1, FALSE),
      (v_q_id, '2 rows', 2, FALSE),
      (v_q_id, '3 rows', 3, TRUE),
      (v_q_id, '5 rows', 4, FALSE);

    -- Q17: SQL Filtering: HAVING vs WHERE
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_sql, 'mcq',
      'Which SQL clause MUST be used when filtering results based on an aggregate function result (e.g., finding departments where `AVG(salary) > 75000`)?',
      'beginner', 1,
      '`WHERE` filters individual rows before grouping takes place. `HAVING` filters aggregated group results after `GROUP BY` is applied.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'WHERE AVG(salary) > 75000', 1, FALSE),
      (v_q_id, 'HAVING AVG(salary) > 75000', 2, TRUE),
      (v_q_id, 'OVER (PARTITION BY AVG(salary) > 75000)', 3, FALSE),
      (v_q_id, 'QUALIFY AVG(salary) > 75000', 4, FALSE);

    -- Q18: Database Indexing & Query Execution
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_sql, 'mcq',
      'You create a composite B-tree index on `users(last_name, first_name)`. Which of the following queries CANNOT effectively utilize this index?',
      'advanced', 1,
      'B-tree composite indexes follow the leftmost prefix rule. Searching by `first_name` alone skips the leading column (`last_name`), so the query engine must perform a full table scan.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'SELECT * FROM users WHERE last_name = ''Smith'' AND first_name = ''John'';', 1, FALSE),
      (v_q_id, 'SELECT * FROM users WHERE last_name = ''Smith'';', 2, FALSE),
      (v_q_id, 'SELECT * FROM users WHERE first_name = ''John'';', 3, TRUE),
      (v_q_id, 'SELECT * FROM users WHERE last_name LIKE ''Smi%'';', 4, FALSE);

    -- =========================================================================
    -- GIT QUESTIONS (2)
    -- =========================================================================
    -- Q19: Git Rebase vs Merge
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_git, 'mcq',
      'What is the fundamental structural difference in Git commit history when integrating a feature branch using `git rebase main` versus `git merge main`?',
      'intermediate', 1,
      '`git merge` creates a new merge commit with two parent commits, preserving exact historical branch topology. `git rebase` rewrites history by replaying feature commits sequentially on top of main, creating a linear history.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Rebase deletes uncommitted working tree files, while merge keeps them', 1, FALSE),
      (v_q_id, 'Rebase replays feature commits sequentially onto the tip of main to create a linear history, whereas merge creates a merge commit preserving original branch topology', 2, TRUE),
      (v_q_id, 'Merge changes commit author timestamps, while rebase preserves original commit hashes unchanged', 3, FALSE),
      (v_q_id, 'Rebase can only be performed on remote origin repositories', 4, FALSE);

    -- Q20: Git Reset Modes
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_git, 'debugging',
      'A developer accidentally runs `git reset --hard HEAD~1`. What is the immediate effect on their working directory and staged changes?',
      'intermediate', 1,
      '`git reset --hard` moves HEAD back one commit, clears the staging index, AND discards all uncommitted working directory changes for tracked files.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'The commit is undone, but staged files and local edits in the working tree are kept intact', 1, FALSE),
      (v_q_id, 'The HEAD commit is undone, index is reset, and working tree changes to tracked files are permanently discarded', 2, TRUE),
      (v_q_id, 'Only untracked files are removed from disk', 3, FALSE),
      (v_q_id, 'Git creates a backup stash automatically named HEAD~1', 4, FALSE);

    -- =========================================================================
    -- TYPESCRIPT QUESTIONS (3)
    -- =========================================================================
    -- Q21: Discriminated Unions & Narrowing
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_ts, 'debugging',
      'Given the TypeScript types:\n\n```ts\ntype SuccessState = { status: "success"; data: string };\ntype ErrorState = { status: "error"; error: Error };\ntype State = SuccessState | ErrorState;\n\nfunction handleState(state: State) {\n  if (state.status === "success") {\n    console.log(state.data.toUpperCase());\n  } else {\n    console.log(state.error.message);\n  }\n}\n```\n\nHow does TypeScript narrow the type of `state` inside the `if` block?',
      'intermediate', 1,
      'TypeScript uses the literal discriminant property `status: "success"` to narrow the union `State` down to `SuccessState`, allowing safe access to `state.data` without type assertion.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Through runtime instance check (instanceof State)', 1, FALSE),
      (v_q_id, 'Through discriminated union type narrowing based on the literal "status" property', 2, TRUE),
      (v_q_id, 'TypeScript cannot narrow this automatically and requires explicit `as SuccessState` cast', 3, FALSE),
      (v_q_id, 'Through automatic dynamic duck-typing duck assertion at runtime', 4, FALSE);

    -- Q22: TypeScript Generic Constraints
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_ts, 'code_output',
      'Which generic function signature correctly enforces that parameter `obj` must possess a numeric property `id`?',
      'intermediate', 1,
      'The constraint `<T extends { id: number }>` specifies that type argument `T` must contain an `id` property of type `number`.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'function getId<T>(obj: T): number { return obj.id; }', 1, FALSE),
      (v_q_id, 'function getId<T extends { id: number }>(obj: T): number { return obj.id; }', 2, TRUE),
      (v_q_id, 'function getId<T implements { id: number }>(obj: T): number { return obj.id; }', 3, FALSE),
      (v_q_id, 'function getId<T = { id: number }>(obj: T): number { return obj.id; }', 4, FALSE);

    -- Q23: TypeScript Type vs Interface & Index Signatures
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (
      v_assessment_id, v_skill_ts, 'mcq',
      'Which feature distinction between `interface` and `type` alias is TRUE in TypeScript?',
      'advanced', 1,
      'Interfaces support declaration merging (multiple `interface` declarations with the same name in the same scope merge their properties), whereas `type` aliases cannot be re-declared.'
    ) RETURNING id INTO v_q_id;

    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Types support inheritance with `extends`, while interfaces only support `implements`', 1, FALSE),
      (v_q_id, 'Interfaces support declaration merging across multiple declarations in the same namespace, while type aliases cannot be re-opened', 2, TRUE),
      (v_q_id, 'Interfaces are evaluated at runtime, while type aliases are completely erased at compile time', 3, FALSE),
      (v_q_id, 'Type aliases can only represent primitive types, not object shapes', 4, FALSE);

  END IF;
END $$;
