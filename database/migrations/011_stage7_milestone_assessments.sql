-- Stage 7: Milestone / Checkpoint Assessments & Question Bank Seed Migration

DO $$
DECLARE
  v_job_role_id BIGINT;
  v_m1_id BIGINT;
  v_m2_id BIGINT;
  v_m3_id BIGINT;
  v_m4_id BIGINT;
  v_m5_id BIGINT;
  v_m6_id BIGINT;
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
  -- Get Job Role ID for Full Stack Developer
  SELECT id INTO v_job_role_id FROM job_roles WHERE title = 'Full Stack Developer' LIMIT 1;
  IF v_job_role_id IS NULL THEN
    RETURN;
  END IF;

  -- Fetch Skill IDs
  SELECT id INTO v_skill_html FROM skills WHERE name = 'HTML' LIMIT 1;
  SELECT id INTO v_skill_css FROM skills WHERE name = 'CSS' LIMIT 1;
  SELECT id INTO v_skill_js FROM skills WHERE name = 'JavaScript' LIMIT 1;
  SELECT id INTO v_skill_react FROM skills WHERE name = 'React' LIMIT 1;
  SELECT id INTO v_skill_node FROM skills WHERE name = 'Node.js' LIMIT 1;
  SELECT id INTO v_skill_rest FROM skills WHERE name = 'REST APIs' LIMIT 1;
  SELECT id INTO v_skill_sql FROM skills WHERE name = 'SQL' LIMIT 1;
  SELECT id INTO v_skill_git FROM skills WHERE name = 'Git' LIMIT 1;
  SELECT id INTO v_skill_ts FROM skills WHERE name = 'TypeScript' LIMIT 1;

  -- =========================================================================
  -- MILESTONE 1: Frontend Foundations Assessment (HTML & CSS)
  -- =========================================================================
  SELECT id INTO v_m1_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 1: Frontend Foundations Checkpoint' LIMIT 1;
  IF v_m1_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 1: Frontend Foundations Checkpoint',
      'Checkpoint evaluation covering HTML5 semantic markup, document accessibility, CSS Box Model, Flexbox layout, and CSS Grid.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m1_id;

    -- Q1 (HTML)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_html, 'mcq', 'Which HTML element should be used to wrap independent, self-contained blog post content on a web page?', 'beginner', 1, 'The <article> element represents a self-contained composition intended to be independently reusable or redistributable.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '<section>', 1, FALSE),
      (v_q_id, '<article>', 2, TRUE),
      (v_q_id, '<aside>', 3, FALSE),
      (v_q_id, '<main>', 4, FALSE);

    -- Q2 (HTML)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_html, 'mcq', 'What is the primary function of the `alt` attribute on an `<img>` tag?', 'beginner', 1, 'The alt attribute provides alternative text for screen readers and displays fallback text if an image fails to load.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'To set the tooltip text when hovering over the image', 1, FALSE),
      (v_q_id, 'To provide an accessible textual alternative for assistive technologies and broken image links', 2, TRUE),
      (v_q_id, 'To specify the high-resolution image source URL', 3, FALSE),
      (v_q_id, 'To define the alignment of the image within surrounding text', 4, FALSE);

    -- Q3 (HTML)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_html, 'mcq', 'Which attribute correctly associates a `<label>` element with an `<input>` element for accessibility?', 'beginner', 1, 'The label `for` attribute matches the input `id` attribute.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'The label `name` attribute matching input `name`', 1, FALSE),
      (v_q_id, 'The label `for` attribute matching input `id`', 2, TRUE),
      (v_q_id, 'The label `id` attribute matching input `for`', 3, FALSE),
      (v_q_id, 'The label `target` attribute matching input `name`', 4, FALSE);

    -- Q4 (HTML)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_html, 'mcq', 'What does the `loading="lazy"` attribute on an `<img>` element accomplish?', 'intermediate', 1, 'Native lazy loading delays fetching the image resource until it approaches the browser viewport.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Decreases the file size of the image automatically', 1, FALSE),
      (v_q_id, 'Defers loading the image until it reaches a calculated distance from the viewport', 2, TRUE),
      (v_q_id, 'Renders a blurred placeholder image while downloading', 3, FALSE),
      (v_q_id, 'Forces the image to load synchronously before DOM Parsing', 4, FALSE);

    -- Q5 (CSS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_css, 'mcq', 'In CSS Box Model with `box-sizing: border-box;`, if an element has `width: 200px; padding: 20px; border: 5px solid black;`, what is its outer rendered content width?', 'intermediate', 1, 'With box-sizing: border-box, padding and border are included within the specified 200px width.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '250px', 1, FALSE),
      (v_q_id, '200px', 2, TRUE),
      (v_q_id, '240px', 3, FALSE),
      (v_q_id, '155px', 4, FALSE);

    -- Q6 (CSS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_css, 'mcq', 'Which Flexbox property aligns items along the cross axis (vertical axis when flex-direction is row)?', 'beginner', 1, 'align-items aligns flex items along the cross axis, while justify-content aligns items along the main axis.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'justify-content', 1, FALSE),
      (v_q_id, 'align-items', 2, TRUE),
      (v_q_id, 'flex-direction', 3, FALSE),
      (v_q_id, 'align-content', 4, FALSE);

    -- Q7 (CSS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_css, 'mcq', 'What is the CSS Grid syntax to create 3 equal fluid columns?', 'intermediate', 1, 'grid-template-columns: repeat(3, 1fr) creates three equal columns using fractional units.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'grid-template-columns: 33% 33% 33%;', 1, FALSE),
      (v_q_id, 'grid-template-columns: repeat(3, 1fr);', 2, TRUE),
      (v_q_id, 'columns: flex(3);', 3, FALSE),
      (v_q_id, 'grid-columns: auto auto auto;', 4, FALSE);

    -- Q8 (CSS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m1_id, v_skill_css, 'mcq', 'Which CSS selector has the highest specificity calculation?', 'intermediate', 1, 'An ID selector (#header) has a specificity of (1,0,0), which outweighs class selectors (0,1,0) and element selectors (0,0,1).') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'div.main-content p.text', 1, FALSE),
      (v_q_id, '#header-logo', 2, TRUE),
      (v_q_id, 'body header .nav-link', 3, FALSE),
      (v_q_id, 'a:hover', 4, FALSE);
  END IF;

  -- =========================================================================
  -- MILESTONE 2: JavaScript Fundamentals Assessment
  -- =========================================================================
  SELECT id INTO v_m2_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 2: JavaScript Core Concepts Checkpoint' LIMIT 1;
  IF v_m2_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 2: JavaScript Core Concepts Checkpoint',
      'Checkpoint evaluation covering closures, scope chain, event loop, promises, async/await, array methods, and ES6+ semantics.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m2_id;

    -- Q1 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'code_output', 'What is the output of `console.log(typeof NaN);` in JavaScript?', 'beginner', 1, 'In JavaScript, NaN stands for "Not-a-Number", but its typeof evaluation returns "number".') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '"nan"', 1, FALSE),
      (v_q_id, '"number"', 2, TRUE),
      (v_q_id, '"undefined"', 3, FALSE),
      (v_q_id, '"object"', 4, FALSE);

    -- Q2 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'code_output', 'What will be printed to the console?\n\n```js\nconst numbers = [1, 2, 3];\nconst result = numbers.map(x => x * 2).filter(x => x > 2);\nconsole.log(result);\n```', 'beginner', 1, 'map produces [2, 4, 6]. filter(x > 2) excludes 2, leaving [4, 6].') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '[2, 4, 6]', 1, FALSE),
      (v_q_id, '[4, 6]', 2, TRUE),
      (v_q_id, '[2, 3]', 3, FALSE),
      (v_q_id, '[6]', 4, FALSE);

    -- Q3 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'debugging', 'What is the result of evaluating `0 == "0"` vs `0 === "0"` in JavaScript?', 'intermediate', 1, 'Loose equality (==) performs type coercion so 0 == "0" is true. Strict equality (===) checks type and value without coercion, so 0 === "0" is false.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Both return true', 1, FALSE),
      (v_q_id, '`0 == "0"` is true, `0 === "0"` is false', 2, TRUE),
      (v_q_id, 'Both return false', 3, FALSE),
      (v_q_id, '`0 == "0"` throws a TypeError', 4, FALSE);

    -- Q4 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'mcq', 'What is a JavaScript "Closure"?', 'intermediate', 1, 'A closure is a function bundled together with references to its surrounding lexical environment, retaining access to outer variables even after the outer function has returned.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'A block of code inside a try...catch block', 1, FALSE),
      (v_q_id, 'A function that retains access to variables in its outer lexical scope even after that scope has closed', 2, TRUE),
      (v_q_id, 'A method used to seal object properties against modification', 3, FALSE),
      (v_q_id, 'An anonymous callback passed to Array.prototype.reduce', 4, FALSE);

    -- Q5 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'code_output', 'What is logged by the following async function?\n\n```js\nasync function getData() {\n  return 42;\n}\nconsole.log(getData());\n```', 'intermediate', 1, 'An async function always returns a Promise resolving to its return value. Output is Promise { 42 }.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '42', 1, FALSE),
      (v_q_id, 'A Promise object that resolves to 42', 2, TRUE),
      (v_q_id, 'undefined', 3, FALSE),
      (v_q_id, 'null', 4, FALSE);

    -- Q6 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'mcq', 'What happens when `Array.prototype.reduce` is called without an initial value on an empty array?', 'intermediate', 1, 'Calling reduce on an empty array without an initial accumulator value throws a TypeError.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Returns undefined', 1, FALSE),
      (v_q_id, 'Throws a TypeError', 2, TRUE),
      (v_q_id, 'Returns null', 3, FALSE),
      (v_q_id, 'Returns 0', 4, FALSE);

    -- Q7 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'code_output', 'What is printed to the console?\n\n```js\nconst obj = { x: 10, getX: function() { return this.x; } };\nconst fn = obj.getX;\nconsole.log(fn());\n```', 'advanced', 1, 'When fn is invoked independently without a receiver object, this defaults to global/undefined, resulting in undefined.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '10', 1, FALSE),
      (v_q_id, 'undefined', 2, TRUE),
      (v_q_id, 'ReferenceError', 3, FALSE),
      (v_q_id, 'null', 4, FALSE);

    -- Q8 (JS)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m2_id, v_skill_js, 'mcq', 'Which statement accurately describes `Promise.all([p1, p2, p3])` behavior?', 'intermediate', 1, 'Promise.all resolves when all promises fulfill, or rejects immediately as soon as ANY promise rejects.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'It waits for all promises to settle regardless of rejections', 1, FALSE),
      (v_q_id, 'It fulfills with an array of values when all input promises fulfill, and rejects immediately if any promise rejects', 2, TRUE),
      (v_q_id, 'It returns only the fastest resolving promise result', 3, FALSE),
      (v_q_id, 'It converts rejected promises into resolved null values', 4, FALSE);
  END IF;

  -- =========================================================================
  -- MILESTONE 3: React Development Assessment
  -- =========================================================================
  SELECT id INTO v_m3_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 3: React Frontend Architecture Checkpoint' LIMIT 1;
  IF v_m3_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 3: React Frontend Architecture Checkpoint',
      'Checkpoint evaluation covering component lifecycle, hooks rules, state reconciliation, context, and memoization.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m3_id;

    -- Q1 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'mcq', 'When does the cleanup function returned inside `useEffect(() => { return () => cleanup(); }, [dep])` execute?', 'intermediate', 1, 'Effect cleanups execute before the component unmounts, AND before re-running the effect on dependency changes.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Only when the browser tab is closed', 1, FALSE),
      (v_q_id, 'Before the component unmounts and before every re-render when dependencies change', 2, TRUE),
      (v_q_id, 'Immediately after the initial component render finishes', 3, FALSE),
      (v_q_id, 'Synchronously during the DOM mutation phase', 4, FALSE);

    -- Q2 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'debugging', 'Why does updating React state directly (e.g., `state.items.push(newItem)`) fail to trigger a component re-render?', 'beginner', 1, 'React compares object references (Object.is). Mutating the array in place does not change the reference, so React skips re-rendering.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Because state variables are marked read-only by JavaScript engines', 1, FALSE),
      (v_q_id, 'React relies on reference equality checks (shallow comparison); in-place mutation preserves the object reference', 2, TRUE),
      (v_q_id, 'Direct mutations trigger immediate synchronous crashes in Strict Mode', 3, FALSE),
      (v_q_id, 'Because state can only be modified inside class component constructors', 4, FALSE);

    -- Q3 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'mcq', 'What is the primary purpose of the `useMemo` hook in React?', 'intermediate', 1, 'useMemo caches the result of a calculation between renders unless dependencies change.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'To persist state across page reloads in browser storage', 1, FALSE),
      (v_q_id, 'To memoize and cache the computed value of an expensive calculation across re-renders', 2, TRUE),
      (v_q_id, 'To dynamically import child components asynchronously', 3, FALSE),
      (v_q_id, 'To prevent child component props from being updated', 4, FALSE);

    -- Q4 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'mcq', 'What rule MUST be followed when calling React Hooks like `useState` or `useEffect`?', 'beginner', 1, 'Hooks must only be called at the top level of React function components or custom hooks, never inside loops or conditions.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Hooks must always be wrapped in async/await functions', 1, FALSE),
      (v_q_id, 'Hooks must be called at the top level of function components, never inside conditional statements or loops', 2, TRUE),
      (v_q_id, 'Hooks must be declared outside of component file exports', 3, FALSE),
      (v_q_id, 'Hooks can only be invoked within class component render methods', 4, FALSE);

    -- Q5 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'code_output', 'What will be rendered if `useRef` is used to track a click count?\n\n```jsx\nfunction Counter() {\n  const count = useRef(0);\n  const handleClick = () => { count.current += 1; };\n  return <button onClick={handleClick}>{count.current}</button>;\n}\n```', 'intermediate', 1, 'Mutating a ref object (`count.current`) does NOT trigger a re-render. The button text stays at 0.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'The button text increments on every click', 1, FALSE),
      (v_q_id, 'The button text remains 0 on screen because mutating a ref does not cause a re-render', 2, TRUE),
      (v_q_id, 'React throws an invalid state mutation error', 3, FALSE),
      (v_q_id, 'The button text displays NaN', 4, FALSE);

    -- Q6 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'mcq', 'How does `useCallback(fn, deps)` differ from `useMemo(fn, deps)`?', 'intermediate', 1, 'useCallback(fn, deps) is equivalent to useMemo(() => fn, deps). It memoizes the callback function instance itself.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'useCallback returns a DOM node reference, while useMemo returns a state value', 1, FALSE),
      (v_q_id, 'useCallback memoizes the function instance itself, while useMemo memoizes the return value of executing a function', 2, TRUE),
      (v_q_id, 'useCallback runs synchronously during DOM paint, while useMemo is asynchronous', 3, FALSE),
      (v_q_id, 'They are identical with no differences', 4, FALSE);

    -- Q7 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'mcq', 'What problem does React `Context` solve in component trees?', 'beginner', 1, 'Context allows passing data through the component tree without manually passing props at every level ("prop drilling").') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Replaces the need for routing libraries', 1, FALSE),
      (v_q_id, 'Avoids "prop drilling" by making values available to any descendant component in the tree', 2, TRUE),
      (v_q_id, 'Improves server-side API response times', 3, FALSE),
      (v_q_id, 'Automatically sanitizes user input against XSS attacks', 4, FALSE);

    -- Q8 (React)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m3_id, v_skill_react, 'debugging', 'When using `React.memo` on a child component receiving an inline object prop (`<Child config={{ theme: "dark" }} />`), why does `React.memo` fail to prevent re-renders?', 'advanced', 1, 'Inline object literals create a new object reference on every parent render, causing React.memo shallow prop comparison to return false.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'React.memo does not work on function components', 1, FALSE),
      (v_q_id, 'New object literals create fresh references on every parent render, failing React.memo shallow comparison check', 2, TRUE),
      (v_q_id, 'Child components must always extend React.Component', 3, FALSE),
      (v_q_id, 'Because theme attributes cannot be memoized in CSS-in-JS', 4, FALSE);
  END IF;

  -- =========================================================================
  -- MILESTONE 4: Backend & REST APIs Assessment
  -- =========================================================================
  SELECT id INTO v_m4_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 4: Backend & REST API Engineering Checkpoint' LIMIT 1;
  IF v_m4_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 4: Backend & REST API Engineering Checkpoint',
      'Checkpoint evaluation covering Node.js event-driven architecture, Express middleware, RESTful API conventions, HTTP status codes, and security.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m4_id;

    -- Q1 (Node.js)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_node, 'mcq', 'What is the role of `next()` in Express.js middleware functions?', 'beginner', 1, 'Calling next() passes control to the next middleware function in the stack.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Ends the HTTP request and sends the response', 1, FALSE),
      (v_q_id, 'Passes execution control to the next middleware in the request-response pipeline', 2, TRUE),
      (v_q_id, 'Restarts the Node.js event loop cycle', 3, FALSE),
      (v_q_id, 'Redirects the request to a new URL path', 4, FALSE);

    -- Q2 (Node.js)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_node, 'mcq', 'Why is performing synchronous CPU-intensive tasks (e.g. blocking loops, heavy encryption) in Node.js main thread problematic?', 'intermediate', 1, 'Node.js uses a single-threaded event loop. Blocking CPU tasks prevent the event loop from processing incoming I/O requests.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'It causes database connection pools to immediately close', 1, FALSE),
      (v_q_id, 'It blocks the single-threaded event loop, delaying all subsequent client requests', 2, TRUE),
      (v_q_id, 'Node.js throws a StackOverflow error after 1 second', 3, FALSE),
      (v_q_id, 'It automatically spawns unmanaged threads that leak RAM', 4, FALSE);

    -- Q3 (Node.js)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_node, 'debugging', 'How should error handling middleware be defined in Express.js so Express recognizes it as an error handler?', 'intermediate', 1, 'Express error middleware MUST accept exactly 4 parameters: (err, req, res, next).') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'app.use((req, res, err) => { ... })', 1, FALSE),
      (v_q_id, 'app.use((err, req, res, next) => { ... })', 2, TRUE),
      (v_q_id, 'app.onError((err) => { ... })', 3, FALSE),
      (v_q_id, 'app.use(async (req, res) => { try {} catch(e) {} })', 4, FALSE);

    -- Q4 (Node.js)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_node, 'mcq', 'What does `process.env` provide in a Node.js application environment?', 'beginner', 1, 'process.env is an object containing user environment variables passed to the Node process.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'A list of installed npm packages', 1, FALSE),
      (v_q_id, 'An object containing environment variables defined in the operating system or runtime configuration', 2, TRUE),
      (v_q_id, 'The global garbage collection status', 3, FALSE),
      (v_q_id, 'The current HTTP request headers', 4, FALSE);

    -- Q5 (REST APIs)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_rest, 'mcq', 'Which HTTP status code should be returned when a resource is successfully created via a `POST` request?', 'beginner', 1, '201 Created indicates that the request has succeeded and led to the creation of a resource.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '200 OK', 1, FALSE),
      (v_q_id, '201 Created', 2, TRUE),
      (v_q_id, '204 No Content', 3, FALSE),
      (v_q_id, '302 Found', 4, FALSE);

    -- Q6 (REST APIs)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_rest, 'mcq', 'What is the semantic distinction between `PUT` and `PATCH` in RESTful APIs?', 'intermediate', 1, 'PUT replaces the entire target resource representation, whereas PATCH applies partial modifications to a resource.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'PUT is safe, PATCH is unsafe', 1, FALSE),
      (v_q_id, 'PUT replaces the entire resource, whereas PATCH applies partial updates to specific resource fields', 2, TRUE),
      (v_q_id, 'PATCH is idempotent, PUT is non-idempotent', 3, FALSE),
      (v_q_id, 'PUT can only be sent over HTTP, while PATCH requires HTTPS', 4, FALSE);

    -- Q7 (REST APIs)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_rest, 'mcq', 'Which HTTP status code signifies that a user is authenticated but lacks authorization permissions to access a resource?', 'intermediate', 1, '403 Forbidden indicates the server understood the request but refuses to authorize it (lacks permissions). 401 Unauthorized means unauthenticated.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '401 Unauthorized', 1, FALSE),
      (v_q_id, '403 Forbidden', 2, TRUE),
      (v_q_id, '400 Bad Request', 3, FALSE),
      (v_q_id, '405 Method Not Allowed', 4, FALSE);

    -- Q8 (REST APIs)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m4_id, v_skill_rest, 'mcq', 'Where should sensitive JWT (JSON Web Tokens) be stored in modern web applications to mitigate Cross-Site Scripting (XSS) token theft?', 'intermediate', 1, 'Storing tokens in HTTP-only, Secure, SameSite cookies prevents JavaScript running in the browser (XSS) from reading the token.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'window.localStorage', 1, FALSE),
      (v_q_id, 'HTTP-only, Secure cookies', 2, TRUE),
      (v_q_id, 'window.sessionStorage', 3, FALSE),
      (v_q_id, 'Public URL query parameters', 4, FALSE);
  END IF;

  -- =========================================================================
  -- MILESTONE 5: Database & SQL Concepts Assessment
  -- =========================================================================
  SELECT id INTO v_m5_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 5: Relational Database & SQL Checkpoint' LIMIT 1;
  IF v_m5_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 5: Relational Database & SQL Checkpoint',
      'Checkpoint evaluation covering relational schema design, SQL queries, joins, indexes, ACID transactions, and aggregations.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m5_id;

    -- Q1 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'What is the primary difference between `INNER JOIN` and `LEFT JOIN` in SQL?', 'beginner', 1, 'INNER JOIN returns only rows with matches in both tables; LEFT JOIN returns all rows from the left table regardless of matches.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'INNER JOIN is faster because it ignores foreign keys', 1, FALSE),
      (v_q_id, 'INNER JOIN returns matching rows in both tables, whereas LEFT JOIN returns all rows from the left table and matched rows from the right table', 2, TRUE),
      (v_q_id, 'LEFT JOIN removes duplicate rows automatically', 3, FALSE),
      (v_q_id, 'They perform identically in relational databases', 4, FALSE);

    -- Q2 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'code_output', 'Consider a `users` table with 5 rows. What is the result of:\n\n```sql\nSELECT COUNT(*), COUNT(email) \nFROM users;\n```\nIf 1 user has a NULL email?', 'intermediate', 1, 'COUNT(*) counts total table rows (5). COUNT(column) ignores NULL values, counting 4 non-null email entries.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, '5, 5', 1, FALSE),
      (v_q_id, '5, 4', 2, TRUE),
      (v_q_id, '4, 4', 3, FALSE),
      (v_q_id, '5, 0', 4, FALSE);

    -- Q3 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'What does the "A" in ACID database properties guarantee?', 'intermediate', 1, 'Atomicity guarantees that all operations within a transaction succeed completely, or all are rolled back cleanly.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Availability', 1, FALSE),
      (v_q_id, 'Atomicity: all database operations in a transaction succeed completely or fail completely', 2, TRUE),
      (v_q_id, 'Authentication', 3, FALSE),
      (v_q_id, 'Asynchronous execution', 4, FALSE);

    -- Q4 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'How do database indexes (e.g. B-Tree) speed up `SELECT` queries, and what trade-off do they introduce?', 'intermediate', 1, 'Indexes allow fast logarithmic lookup for SELECT queries, but slow down INSERT/UPDATE/DELETE operations due to index maintenance overhead.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Indexes compress data on disk with zero write trade-offs', 1, FALSE),
      (v_q_id, 'Indexes speed up data retrieval queries but increase storage space and add overhead to write operations', 2, TRUE),
      (v_q_id, 'Indexes prevent duplicate primary keys in tables', 3, FALSE),
      (v_q_id, 'Indexes automatically convert relational tables into NoSQL documents', 4, FALSE);

    -- Q5 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'Which SQL statement prevents SQL Injection vulnerabilities when executing dynamic queries in application code?', 'beginner', 1, 'Using parameterized queries / prepared statements binds inputs as parameters rather than concatenating untrusted strings into SQL.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'String concatenation with single quote replacement', 1, FALSE),
      (v_q_id, 'Parameterized queries / Prepared statements with placeholders', 2, TRUE),
      (v_q_id, 'Wrapping queries in stored procedure transactions', 3, FALSE),
      (v_q_id, 'Converting all string queries to uppercase', 4, FALSE);

    -- Q6 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'What is the function of a Foreign Key constraint in relational tables?', 'beginner', 1, 'A Foreign Key enforces referential integrity between related tables by ensuring values match primary keys in the referenced table.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Encrypts column data across foreign databases', 1, FALSE),
      (v_q_id, 'Enforces referential integrity by linking a column to a primary key in another table', 2, TRUE),
      (v_q_id, 'Automatically generates unique integer IDs for new rows', 3, FALSE),
      (v_q_id, 'Prevents NULL values from being inserted into text fields', 4, FALSE);

    -- Q7 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'code_output', 'What does `SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 5;` return?', 'intermediate', 1, 'Groups products by category and filters out categories that have 5 or fewer products.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'All products in category 5', 1, FALSE),
      (v_q_id, 'Product categories that contain more than 5 products, along with their respective product count', 2, TRUE),
      (v_q_id, 'The top 5 product categories sorted by price', 3, FALSE),
      (v_q_id, 'A count of products whose ID is greater than 5', 4, FALSE);

    -- Q8 (SQL)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m5_id, v_skill_sql, 'mcq', 'Which normalization level removes partial dependencies by ensuring all non-key attributes are fully functionally dependent on the entire primary key?', 'intermediate', 1, 'Second Normal Form (2NF) eliminates partial key dependencies in tables with composite primary keys.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'First Normal Form (1NF)', 1, FALSE),
      (v_q_id, 'Second Normal Form (2NF)', 2, TRUE),
      (v_q_id, 'Third Normal Form (3NF)', 3, FALSE),
      (v_q_id, 'Boyce-Codd Normal Form (BCNF)', 4, FALSE);
  END IF;

  -- =========================================================================
  -- MILESTONE 6: Integration & Tooling Assessment (TypeScript & Git)
  -- =========================================================================
  SELECT id INTO v_m6_id FROM assessments WHERE job_role_id = v_job_role_id AND title = 'Milestone 6: Integration, TypeScript & Git Checkpoint' LIMIT 1;
  IF v_m6_id IS NULL THEN
    INSERT INTO assessments (job_role_id, title, description, assessment_type, duration_minutes, total_questions, passing_score, version, status)
    VALUES (
      v_job_role_id,
      'Milestone 6: Integration, TypeScript & Git Checkpoint',
      'Checkpoint evaluation covering TypeScript strict type checking, generics, union types, Git branching, rebasing, and merge resolution.',
      'milestone',
      15,
      8,
      70,
      1,
      'active'
    ) RETURNING id INTO v_m6_id;

    -- Q1 (TypeScript)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_ts, 'mcq', 'Why is `unknown` preferred over `any` in TypeScript for unvalidated dynamic data?', 'intermediate', 1, 'unknown enforces type checks before operating on the value, preserving compile-time type safety.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'unknown converts values into JSON strings at runtime', 1, FALSE),
      (v_q_id, 'unknown forces explicit type checks or assertions before allowing operations, whereas any disables type checking entirely', 2, TRUE),
      (v_q_id, 'unknown can only hold primitive numbers and booleans', 3, FALSE),
      (v_q_id, 'They are identical aliases in TypeScript compiler settings', 4, FALSE);

    -- Q2 (TypeScript)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_ts, 'mcq', 'What utility type converts all properties of interface `User` into optional properties?', 'beginner', 1, 'Partial<User> creates a type with all properties of User set to optional.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Required<User>', 1, FALSE),
      (v_q_id, 'Partial<User>', 2, TRUE),
      (v_q_id, 'Readonly<User>', 3, FALSE),
      (v_q_id, 'Pick<User, optional>', 4, FALSE);

    -- Q3 (TypeScript)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_ts, 'debugging', 'Given `type Action = { type: "login"; user: string } | { type: "logout" }`. How does TypeScript narrow the type inside `if (action.type === "login")`?', 'intermediate', 1, 'TypeScript narrows discriminated union types by evaluating literal property matches like type: "login".') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Through runtime type reflection', 1, FALSE),
      (v_q_id, 'Discriminated union type narrowing via the shared literal "type" property', 2, TRUE),
      (v_q_id, 'Requires an explicit `as { user: string }` type cast', 3, FALSE),
      (v_q_id, 'Using instanceof Action runtime inspection', 4, FALSE);

    -- Q4 (TypeScript)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_ts, 'mcq', 'What does the `never` type represent in TypeScript?', 'advanced', 1, 'The never type represents values that will never occur (e.g., functions that throw errors or enter infinite loops, or exhausted switch branches).') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'An uninitialized variable', 1, FALSE),
      (v_q_id, 'The return type of functions that never return normally (e.g. throw error or infinite loop) or unreachable union branches', 2, TRUE),
      (v_q_id, 'A null pointer reference', 3, FALSE),
      (v_q_id, 'A deprecated feature flag', 4, FALSE);

    -- Q5 (Git)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_git, 'mcq', 'What command stages specific modified changes in `src/app.ts` for the next commit?', 'beginner', 1, 'git add src/app.ts stages the specified file into the index.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'git commit src/app.ts', 1, FALSE),
      (v_q_id, 'git add src/app.ts', 2, TRUE),
      (v_q_id, 'git push src/app.ts', 3, FALSE),
      (v_q_id, 'git checkout src/app.ts', 4, FALSE);

    -- Q6 (Git)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_git, 'mcq', 'What does `git stash` do to uncommitted working directory changes?', 'beginner', 1, 'git stash temporarily shelves (or stashes) your uncommitted changes so you can work on something else, restoring your working directory to clean HEAD.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Permanently deletes all uncommitted files', 1, FALSE),
      (v_q_id, 'Temporarily saves modified tracked files on a storage stack and reverts working directory to clean HEAD state', 2, TRUE),
      (v_q_id, 'Pushes local commits directly to the remote repository', 3, FALSE),
      (v_q_id, 'Creates a public release tag on GitHub', 4, FALSE);

    -- Q7 (Git)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_git, 'mcq', 'What is the purpose of `git cherry-pick <commit-hash>`?', 'intermediate', 1, 'git cherry-pick applies the changes introduced by an existing commit from another branch onto the current branch.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'Deletes a broken commit from remote history', 1, FALSE),
      (v_q_id, 'Applies the exact changes introduced by a specific existing commit from another branch onto the active branch', 2, TRUE),
      (v_q_id, 'Merges two remote repositories together', 3, FALSE),
      (v_q_id, 'Squashes all commits in the repository into a single initial commit', 4, FALSE);

    -- Q8 (Git)
    INSERT INTO assessment_questions (assessment_id, skill_id, question_type, question_text, difficulty, points, explanation)
    VALUES (v_m6_id, v_skill_git, 'mcq', 'How can a developer recover a deleted branch or lost commit in Git?', 'intermediate', 1, 'git reflog records every HEAD updates, allowing recovery of deleted branch tips or lost commits.') RETURNING id INTO v_q_id;
    INSERT INTO assessment_question_options (question_id, option_text, option_order, is_correct) VALUES
      (v_q_id, 'By re-cloning the repository from scratch', 1, FALSE),
      (v_q_id, 'By inspecting `git reflog` to locate the commit hash and checking it out or creating a branch', 2, TRUE),
      (v_q_id, 'By running git init --force', 3, FALSE),
      (v_q_id, 'Deleted commits in Git cannot be recovered', 4, FALSE);
  END IF;

END $$;
