export type VideoResource = {
  title: string;
  channel: string;
  url: string;
};

export type ExtraResource = {
  title: string;
  url: string;
  type?: string;
};

export type CuratedResource = {
  id: string;
  title: string;
  url: string;
  type: "video" | "documentation" | "tutorial" | "reference" | "guide";
  provider: string;
  channel?: string;
  skills: string[];
  topicTags: string[];
};

export type StepMatchInput = {
  title: string;
  description: string;
  skills?: string[];
};

export const RESOURCE_CATALOG: CuratedResource[] = [
  // 1. JavaScript Fundamentals
  {
    id: "js-fund-video-1",
    title: "JavaScript Tutorial for Beginners: 30-Minute Crash Course",
    url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["JavaScript", "Programming Fundamentals"],
    topicTags: ["javascript", "js", "variables", "data types", "operators", "syntax", "basics", "fundamentals"],
  },
  {
    id: "js-fund-video-2",
    title: "JavaScript Programming - Full Course",
    url: "https://www.youtube.com/watch?v=jS4aFq5-91M",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["JavaScript", "Web Development"],
    topicTags: ["javascript", "js", "ecmascript", "es6", "basics", "fundamentals", "control flow"],
  },
  {
    id: "js-fund-doc-1",
    title: "MDN Web Docs - JavaScript First Steps",
    url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["JavaScript"],
    topicTags: ["javascript", "js", "variables", "strings", "numbers", "syntax", "basics"],
  },
  {
    id: "js-fund-doc-2",
    title: "The Modern JavaScript Tutorial - JavaScript.info",
    url: "https://javascript.info/",
    type: "tutorial",
    provider: "JavaScript.info",
    skills: ["JavaScript"],
    topicTags: ["javascript", "js", "fundamentals", "code structure", "types"],
  },

  // 2. Functions / Scope
  {
    id: "js-func-video-1",
    title: "JavaScript Functions - Arrow Functions & Scope Explained",
    url: "https://www.youtube.com/watch?v=gigtS1aC5GE",
    type: "video",
    provider: "Dave Gray",
    channel: "Dave Gray",
    skills: ["JavaScript", "Functions"],
    topicTags: ["function", "functions", "scope", "arrow functions", "closures", "lexical scope", "parameters", "return values"],
  },
  {
    id: "js-func-doc-1",
    title: "MDN Web Docs - JavaScript Functions Guide",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["JavaScript", "Functions"],
    topicTags: ["function", "functions", "scope", "parameters", "arrow functions", "recursion", "closures"],
  },
  {
    id: "js-func-doc-2",
    title: "JavaScript.info - Variable Scope and Closures",
    url: "https://javascript.info/closure",
    type: "tutorial",
    provider: "JavaScript.info",
    skills: ["JavaScript"],
    topicTags: ["scope", "closures", "lexical environment", "var", "let", "const"],
  },

  // 3. Arrays / Objects
  {
    id: "js-array-obj-video-1",
    title: "JavaScript Array Methods (map, filter, reduce, find)",
    url: "https://www.youtube.com/watch?v=R8rmfD9Y5-c",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["JavaScript", "Data Structures"],
    topicTags: ["array", "arrays", "object", "objects", "array methods", "map", "filter", "reduce", "destructuring", "data structures"],
  },
  {
    id: "js-array-doc-1",
    title: "MDN Web Docs - Indexed Collections & Arrays",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["JavaScript"],
    topicTags: ["array", "arrays", "array methods", "iteration", "elements", "lists"],
  },
  {
    id: "js-obj-doc-1",
    title: "MDN Web Docs - Working with Objects",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["JavaScript"],
    topicTags: ["object", "objects", "properties", "key-value", "prototypes", "json", "object methods"],
  },

  // 4. DOM
  {
    id: "dom-video-1",
    title: "DOM Manipulation Crash Course",
    url: "https://www.youtube.com/watch?v=0ik6X4DJK6w",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["DOM", "Frontend Development"],
    topicTags: ["dom", "document object model", "event", "events", "event listener", "queryselector", "element manipulation"],
  },
  {
    id: "dom-doc-1",
    title: "MDN Web Docs - Introduction to the DOM",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["DOM"],
    topicTags: ["dom", "document", "nodes", "events", "browser api", "html elements"],
  },

  // 5. Async JavaScript & Promises
  {
    id: "async-video-1",
    title: "Async JavaScript & Fetch API Tutorial",
    url: "https://www.youtube.com/watch?v=Oive66jrwBs",
    type: "video",
    provider: "Traversy Media",
    channel: "Traversy Media",
    skills: ["Async JS", "Fetch API"],
    topicTags: ["async", "asynchronous", "fetch", "ajax", "promises", "async/await", "http requests"],
  },
  {
    id: "async-video-2",
    title: "JavaScript Promises in 10 Minutes",
    url: "https://www.youtube.com/watch?v=DHvZLI7DbU0",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["JavaScript", "Promises"],
    topicTags: ["promise", "promises", "async", "await", "event loop", "callbacks", "asynchronous"],
  },
  {
    id: "async-doc-1",
    title: "MDN Web Docs - Asynchronous JavaScript",
    url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["Async JS"],
    topicTags: ["async", "asynchronous", "promise", "promises", "async/await", "event loop"],
  },
  {
    id: "fetch-doc-1",
    title: "MDN Web Docs - Using Fetch API",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
    type: "reference",
    provider: "MDN Web Docs",
    skills: ["Fetch API"],
    topicTags: ["fetch", "http requests", "api calls", "headers", "json response"],
  },

  // 6. TypeScript
  {
    id: "ts-video-1",
    title: "TypeScript Full Course for Beginners",
    url: "https://www.youtube.com/watch?v=gieEQFIfgYc",
    type: "video",
    provider: "Dave Gray",
    channel: "Dave Gray",
    skills: ["TypeScript"],
    topicTags: ["typescript", "ts", "types", "interfaces", "generics", "type-checking", "type safety"],
  },
  {
    id: "ts-video-2",
    title: "TypeScript Tutorial for Beginners",
    url: "https://www.youtube.com/watch?v=d56mG7DezGs",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["TypeScript"],
    topicTags: ["typescript", "ts", "compiler", "type annotations", "unions", "enums"],
  },
  {
    id: "ts-doc-1",
    title: "Official TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    type: "documentation",
    provider: "TypeScript Documentation",
    skills: ["TypeScript"],
    topicTags: ["typescript", "ts", "types", "interfaces", "generics", "type inference"],
  },
  {
    id: "ts-doc-2",
    title: "TypeScript Cheat Sheets",
    url: "https://www.typescriptlang.org/cheatsheets/",
    type: "reference",
    provider: "TypeScript Documentation",
    skills: ["TypeScript"],
    topicTags: ["typescript", "ts", "cheat sheet", "syntax reference", "types"],
  },

  // 7. React Fundamentals
  {
    id: "react-fund-video-1",
    title: "React Course - Beginner's Tutorial",
    url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["React"],
    topicTags: ["react", "jsx", "component", "components", "frontend", "ui library", "virtual dom", "react fundamentals"],
  },
  {
    id: "react-fund-video-2",
    title: "React Tutorial for Beginners",
    url: "https://www.youtube.com/watch?v=SqcY0GlETPk",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["React"],
    topicTags: ["react", "component", "components", "jsx", "rendering", "ui"],
  },
  {
    id: "react-doc-1",
    title: "React Official Documentation - Quick Start",
    url: "https://react.dev/learn",
    type: "documentation",
    provider: "React Dev",
    skills: ["React"],
    topicTags: ["react", "jsx", "component", "components", "quick start", "getting started"],
  },

  // 8. React State and Props
  {
    id: "react-state-props-video",
    title: "React Props vs State Explained",
    url: "https://www.youtube.com/watch?v=IYvD9oBCuJI",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["React", "State Management"],
    topicTags: ["state", "props", "react state", "react props", "usestate", "component state", "data flow"],
  },
  {
    id: "react-state-doc-1",
    title: "React Dev - Managing State",
    url: "https://react.dev/learn/managing-state",
    type: "documentation",
    provider: "React Dev",
    skills: ["React State"],
    topicTags: ["state", "props", "managing state", "lifting state", "react state"],
  },
  {
    id: "react-props-doc-1",
    title: "React Dev - Passing Props to a Component",
    url: "https://react.dev/learn/passing-props-to-a-component",
    type: "documentation",
    provider: "React Dev",
    skills: ["React Props"],
    topicTags: ["props", "parent child", "component props", "data passing"],
  },

  // 9. React Hooks
  {
    id: "react-hooks-video-1",
    title: "React Hooks Explained - useState, useEffect & Custom Hooks",
    url: "https://www.youtube.com/watch?v=TNhaISOUy6Q",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["React Hooks"],
    topicTags: ["hook", "hooks", "usestate", "useeffect", "usecontext", "custom hook", "custom hooks", "react hooks"],
  },
  {
    id: "react-hooks-doc-1",
    title: "React Dev - Built-in React Hooks",
    url: "https://react.dev/reference/react/hooks",
    type: "reference",
    provider: "React Dev",
    skills: ["React Hooks"],
    topicTags: ["hook", "hooks", "usestate", "useeffect", "usecontext", "built-in hooks", "hook reference"],
  },
  {
    id: "react-hooks-doc-2",
    title: "React Dev - Reusing Logic with Custom Hooks",
    url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
    type: "documentation",
    provider: "React Dev",
    skills: ["Custom Hooks"],
    topicTags: ["custom hook", "custom hooks", "hook", "hooks", "logic reuse"],
  },

  // 10. React Routing
  {
    id: "react-routing-video-1",
    title: "React Router 6 Tutorial for Beginners",
    url: "https://www.youtube.com/watch?v=Ul3y1LXxzdU",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["React Router"],
    topicTags: ["routing", "react router", "routes", "navigation", "link", "url parameters", "spa routing"],
  },
  {
    id: "react-routing-doc-1",
    title: "React Router Documentation - Main Concepts",
    url: "https://reactrouter.com/en/main/start/overview",
    type: "documentation",
    provider: "React Router",
    skills: ["React Router"],
    topicTags: ["routing", "react router", "routes", "navigation", "loader", "action"],
  },

  // 11. REST APIs & HTTP
  {
    id: "rest-api-video-1",
    title: "Build a REST API with Node.js and Express",
    url: "https://www.youtube.com/watch?v=fgTGADljAeg",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["REST API", "HTTP"],
    topicTags: ["rest", "api", "restful", "http", "endpoints", "get", "post", "put", "delete", "crud"],
  },
  {
    id: "rest-api-video-2",
    title: "REST APIs in 100 Seconds",
    url: "https://www.youtube.com/watch?v=-MTSQjw5DrM",
    type: "video",
    provider: "Fireship",
    channel: "Fireship",
    skills: ["REST API"],
    topicTags: ["rest", "api", "restful", "architecture", "endpoints", "stateless"],
  },
  {
    id: "http-status-doc-1",
    title: "MDN Web Docs - Overview of HTTP Status Codes",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status",
    type: "reference",
    provider: "MDN Web Docs",
    skills: ["HTTP Status Codes"],
    topicTags: ["http", "status code", "status codes", "200", "404", "500", "401", "403", "requests", "responses"],
  },
  {
    id: "rest-doc-1",
    title: "MDN Web Docs - What is REST?",
    url: "https://developer.mozilla.org/en-US/docs/Glossary/REST",
    type: "reference",
    provider: "MDN Web Docs",
    skills: ["REST Architecture"],
    topicTags: ["rest", "api", "restful", "http methods", "resource"],
  },

  // 12. Node.js & Express
  {
    id: "node-video-1",
    title: "Node.js Tutorial for Beginners: Learn Node in 1 Hour",
    url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["Node.js"],
    topicTags: ["node", "nodejs", "runtime", "npm", "backend", "event loop", "modules"],
  },
  {
    id: "express-video-1",
    title: "Node.js and Express.js - Full Course",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Express.js", "Node.js"],
    topicTags: ["express", "expressjs", "middleware", "routing", "backend framework", "server"],
  },
  {
    id: "node-doc-1",
    title: "Official Node.js API Documentation",
    url: "https://nodejs.org/docs/latest/api/",
    type: "documentation",
    provider: "Node.js Documentation",
    skills: ["Node.js"],
    topicTags: ["node", "nodejs", "api reference", "fs", "http module", "process"],
  },
  {
    id: "express-doc-1",
    title: "Express.js Getting Started & Routing Guide",
    url: "https://expressjs.com/en/starter/installing.html",
    type: "documentation",
    provider: "Express.js Documentation",
    skills: ["Express.js"],
    topicTags: ["express", "expressjs", "routing", "middleware", "req res", "starter guide"],
  },

  // 13. Authentication & Authorization & Sessions & Cookies & JWT
  {
    id: "jwt-auth-video-1",
    title: "JWT Authentication Tutorial - Node.js Express",
    url: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["JWT", "Authentication"],
    topicTags: ["authentication", "authorization", "jwt", "json web token", "json web tokens", "session", "sessions", "token", "tokens", "login", "access control"],
  },
  {
    id: "password-auth-video-1",
    title: "Node.js User Authentication with Password Hashing & Tokens",
    url: "https://www.youtube.com/watch?v=f2EqECiTBL8",
    type: "video",
    provider: "Dave Gray",
    channel: "Dave Gray",
    skills: ["Authentication", "Security"],
    topicTags: ["authentication", "authorization", "bcrypt", "hashing", "cookie", "cookies", "session management", "refresh tokens", "auth"],
  },
  {
    id: "owasp-auth-doc-1",
    title: "OWASP Authentication & Session Management Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
    type: "reference",
    provider: "OWASP",
    skills: ["Security", "Authentication"],
    topicTags: ["authentication", "authorization", "session", "sessions", "cookie", "cookies", "security", "login", "passwords", "access control", "auth"],
  },
  {
    id: "jwt-doc-1",
    title: "JWT.io Introduction to JSON Web Tokens",
    url: "https://jwt.io/introduction",
    type: "documentation",
    provider: "Auth0 / JWT.io",
    skills: ["JWT"],
    topicTags: ["jwt", "json web token", "json web tokens", "token", "tokens", "bearer token", "authentication"],
  },
  {
    id: "mdn-cookies-doc-1",
    title: "MDN Web Docs - Using HTTP Cookies for Sessions",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies",
    type: "documentation",
    provider: "MDN Web Docs",
    skills: ["Cookies", "Session Management"],
    topicTags: ["cookie", "cookies", "session", "sessions", "session management", "http-only", "samesite", "secure cookie"],
  },

  // 14. SQL, Database Design & PostgreSQL
  {
    id: "sql-video-1",
    title: "SQL Tutorial - Full Database Course for Beginners",
    url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["SQL", "Databases"],
    topicTags: ["sql", "query", "queries", "select", "insert", "update", "join", "joins", "relational database", "schema"],
  },
  {
    id: "postgres-video-1",
    title: "PostgreSQL Tutorial for Beginners",
    url: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["PostgreSQL"],
    topicTags: ["postgres", "postgresql", "psql", "sql database", "tables", "primary key", "foreign key"],
  },
  {
    id: "db-design-video-1",
    title: "Database Design Course - Learn Relational Database Design",
    url: "https://www.youtube.com/watch?v=ztHopE5Wnpc",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Database Design"],
    topicTags: ["database design", "normalization", "erd", "relationships", "entity relationship", "schemas", "table design"],
  },
  {
    id: "postgres-doc-1",
    title: "Official PostgreSQL Documentation",
    url: "https://www.postgresql.org/docs/current/",
    type: "documentation",
    provider: "PostgreSQL Global Development Group",
    skills: ["PostgreSQL"],
    topicTags: ["postgres", "postgresql", "sql syntax", "database administration"],
  },
  {
    id: "postgres-tutorial-doc-1",
    title: "PostgreSQL Tutorial - Interactive SQL Guide",
    url: "https://www.postgresqltutorial.com/",
    type: "tutorial",
    provider: "PostgreSQL Tutorial",
    skills: ["SQL", "PostgreSQL"],
    topicTags: ["sql", "postgres", "join", "joins", "subqueries", "ddl", "dml"],
  },

  // 15. ORM & Database Access
  {
    id: "orm-video-1",
    title: "Prisma ORM Crash Course - Node.js & TypeScript",
    url: "https://www.youtube.com/watch?v=ReK0L2kpTac",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["ORM", "Prisma"],
    topicTags: ["orm", "prisma", "database access", "drizzle", "migration", "migrations", "data modeling", "query builder"],
  },
  {
    id: "prisma-doc-1",
    title: "Official Prisma Documentation & Getting Started",
    url: "https://www.prisma.io/docs",
    type: "documentation",
    provider: "Prisma",
    skills: ["Prisma ORM"],
    topicTags: ["orm", "prisma", "schema", "database access", "client", "migrations"],
  },
  {
    id: "drizzle-doc-1",
    title: "Drizzle ORM Documentation",
    url: "https://orm.drizzle.team/docs/overview",
    type: "documentation",
    provider: "Drizzle Team",
    skills: ["Drizzle ORM"],
    topicTags: ["orm", "drizzle", "typescript orm", "sql builder", "migrations"],
  },

  // 16. Input Validation & Schemas (Zod)
  {
    id: "zod-video-1",
    title: "Input Validation with Zod in TypeScript and Node",
    url: "https://www.youtube.com/watch?v=L6BE-U3oy80",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["Zod", "Validation"],
    topicTags: ["validation", "zod", "schemas", "input validation", "sanitization", "error handling"],
  },
  {
    id: "zod-doc-1",
    title: "Zod Official Documentation",
    url: "https://zod.dev/",
    type: "documentation",
    provider: "Zod",
    skills: ["Zod"],
    topicTags: ["zod", "validation", "schema validation", "typescript type inference"],
  },

  // 17. Testing
  {
    id: "testing-video-1",
    title: "JavaScript Testing with Vitest and Jest",
    url: "https://www.youtube.com/watch?v=7r4xVDI2vho",
    type: "video",
    provider: "Web Dev Simplified",
    channel: "Web Dev Simplified",
    skills: ["Testing", "Vitest", "Jest"],
    topicTags: ["test", "testing", "unit test", "unit testing", "integration test", "vitest", "jest", "mocking", "test suites", "assertions"],
  },
  {
    id: "vitest-doc-1",
    title: "Vitest Official Documentation",
    url: "https://vitest.dev/guide/",
    type: "documentation",
    provider: "Vitest",
    skills: ["Vitest"],
    topicTags: ["vitest", "testing", "unit test", "unit tests", "test runner", "assertions"],
  },
  {
    id: "rtl-doc-1",
    title: "React Testing Library Documentation",
    url: "https://testing-library.com/docs/react-testing-library/intro/",
    type: "documentation",
    provider: "Testing Library",
    skills: ["React Testing Library"],
    topicTags: ["testing", "react testing library", "component testing", "dom testing", "render"],
  },

  // 18. Git & GitHub
  {
    id: "git-video-1",
    title: "Git and GitHub for Beginners - Crash Course",
    url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Git", "GitHub"],
    topicTags: ["git", "github", "version control", "commit", "commits", "branch", "branches", "pull request", "merge", "repository"],
  },
  {
    id: "git-doc-1",
    title: "Official Pro Git Book",
    url: "https://git-scm.com/doc",
    type: "documentation",
    provider: "Git Documentation",
    skills: ["Git"],
    topicTags: ["git", "version control", "commands", "rebase", "branching"],
  },
  {
    id: "github-doc-1",
    title: "GitHub Docs - Getting Started with Git",
    url: "https://docs.github.com/en/get-started/using-git/about-git",
    type: "documentation",
    provider: "GitHub Docs",
    skills: ["GitHub"],
    topicTags: ["github", "git", "collaboration", "pull requests", "workflows"],
  },

  // 19. Deployment & Cloud
  {
    id: "deploy-video-1",
    title: "Deploy Full Stack Apps to Vercel and Cloud Platforms",
    url: "https://www.youtube.com/watch?v=22RhyO_FwU0",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Deployment", "Vercel"],
    topicTags: ["deploy", "deployment", "vercel", "cloud", "production", "hosting", "hosting platforms"],
  },
  {
    id: "vercel-doc-1",
    title: "Vercel Deployment Documentation",
    url: "https://vercel.com/docs",
    type: "documentation",
    provider: "Vercel",
    skills: ["Vercel"],
    topicTags: ["vercel", "deployment", "hosting", "build settings", "serverless"],
  },
  {
    id: "12factor-doc-1",
    title: "12-Factor App Methodology for Cloud Applications",
    url: "https://12factor.net/",
    type: "reference",
    provider: "12-Factor",
    skills: ["Cloud Architecture"],
    topicTags: ["deploy", "deployment", "cloud", "12-factor", "configuration", "stateless processes", "environment variables"],
  },

  // 20. Docker & Containers
  {
    id: "docker-video-1",
    title: "Docker Tutorial for Beginners",
    url: "https://www.youtube.com/watch?v=pTFZFxd4hOI",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["Docker", "Containers"],
    topicTags: ["docker", "container", "containers", "dockerfile", "images", "docker-compose", "containerization", "devops"],
  },
  {
    id: "docker-doc-1",
    title: "Official Docker Documentation & Orientation Guide",
    url: "https://docs.docker.com/get-started/",
    type: "documentation",
    provider: "Docker Docs",
    skills: ["Docker"],
    topicTags: ["docker", "container", "containers", "dockerfile", "docker compose", "containerization"],
  },

  // 21. Web Security
  {
    id: "sec-video-1",
    title: "Web Security Basics (XSS, CSRF, Injection) Explained",
    url: "https://www.youtube.com/watch?v=0kXfVj4jR3A",
    type: "video",
    provider: "Fireship",
    channel: "Fireship",
    skills: ["Web Security", "OWASP"],
    topicTags: ["security", "web security", "xss", "csrf", "injection", "sql injection", "cors", "owasp", "sanitization", "env"],
  },
  {
    id: "owasp-top10-doc-1",
    title: "OWASP Top Ten Web Application Security Risks",
    url: "https://owasp.org/www-project-top-ten/",
    type: "documentation",
    provider: "OWASP",
    skills: ["Web Security"],
    topicTags: ["security", "owasp", "vulnerabilities", "web security", "xss", "csrf"],
  },
  {
    id: "next-env-sec-doc-1",
    title: "Next.js Environment Variables & Security Reference",
    url: "https://nextjs.org/docs/app/building-your-application/configuring/environment-variables",
    type: "reference",
    provider: "Next.js Docs",
    skills: ["Environment Variables", "Security"],
    topicTags: ["security", "env", "environment variables", "secrets", "api keys"],
  },

  // 22. Python & Frameworks
  {
    id: "python-video-1",
    title: "Python for Beginners - Full Course",
    url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
    type: "video",
    provider: "Programming with Mosh",
    channel: "Programming with Mosh",
    skills: ["Python"],
    topicTags: ["python", "django", "flask", "fastapi", "python syntax"],
  },
  {
    id: "python-doc-1",
    title: "Official Python Documentation & Tutorial",
    url: "https://docs.python.org/3/tutorial/",
    type: "documentation",
    provider: "Python Software Foundation",
    skills: ["Python"],
    topicTags: ["python", "data structures", "modules", "classes"],
  },

  // 23. Linux & CLI
  {
    id: "linux-video-1",
    title: "Linux Command Line Tutorial For Beginners",
    url: "https://www.youtube.com/watch?v=ZtqBQ68cfJc",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Linux", "CLI"],
    topicTags: ["linux", "bash", "shell", "terminal", "command line", "cli"],
  },
  {
    id: "linux-doc-1",
    title: "Linux Journey - Interactive Learning Guide",
    url: "https://linuxjourney.com/",
    type: "tutorial",
    provider: "Linux Journey",
    skills: ["Linux"],
    topicTags: ["linux", "command line", "permissions", "filesystem", "bash"],
  },

  // 24. Computer Networking
  {
    id: "networking-video-1",
    title: "Computer Networking Course - Network Fundamentals",
    url: "https://www.youtube.com/watch?v=IPvYjXCsTg8",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Networking"],
    topicTags: ["network", "networking", "tcp", "ip", "dns", "http", "tls", "sockets"],
  },
  {
    id: "networking-doc-1",
    title: "Cloudflare Learning Center - Networking Concepts",
    url: "https://www.cloudflare.com/learning/network-layer/what-is-the-network-layer/",
    type: "reference",
    provider: "Cloudflare",
    skills: ["Networking"],
    topicTags: ["network", "networking", "dns", "ip", "tcp", "http", "tls"],
  },

  // 25. Cybersecurity Fundamentals
  {
    id: "cybersec-video-1",
    title: "Cyber Security Full Course for Beginners",
    url: "https://www.youtube.com/watch?v=U_P23SqJaDc",
    type: "video",
    provider: "freeCodeCamp.org",
    channel: "freeCodeCamp.org",
    skills: ["Cybersecurity"],
    topicTags: ["cybersecurity", "security analyst", "vulnerability", "cryptography", "encryption"],
  },
  {
    id: "owasp-projects-doc-1",
    title: "OWASP Foundation Project Index",
    url: "https://owasp.org/projects/",
    type: "documentation",
    provider: "OWASP",
    skills: ["Cybersecurity"],
    topicTags: ["cybersecurity", "owasp", "vulnerability", "cryptography"],
  },
];

// Minimum relevance score required for a resource to be selected for a step.
// Weak or unrelated matches will return 0 score and be excluded.
const MIN_RELEVANCE_SCORE = 5;

// Threshold for allowing resource reuse across steps if no unused alternative is available.
const HIGH_RELEVANCE_SCORE_FOR_REUSE = 10;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesTag(text: string, tag: string): boolean {
  if (!text || !tag) return false;
  const normalizedText = text.toLowerCase();
  const normalizedTag = tag.toLowerCase();

  // Short tags (<=3 chars e.g. "js", "ts", "dom", "sql", "git", "api", "orm", "jwt", "cli")
  // require word boundary matching to prevent false positives like "json" matching "js".
  if (normalizedTag.length <= 3) {
    const regex = new RegExp(`\\b${escapeRegExp(normalizedTag)}\\b`, "i");
    return regex.test(normalizedText);
  }

  return normalizedText.includes(normalizedTag);
}

/**
 * Score a curated resource against a step topic.
 *
 * Scoring priority:
 * 1. Step Title match (Highest weight: 5x)
 * 2. Step Description match (Medium weight: 2x)
 * 3. Step Skills match (Low weight: 1x)
 *
 * HARD REQUIREMENT: A resource MUST match at least one topicTag in the step's title OR description.
 * Skill matches alone cannot trigger a resource selection if title & description match zero topicTags.
 */
export function scoreResourceForStep(
  resource: CuratedResource,
  step: StepMatchInput
): number {
  const titleText = step.title || "";
  const descText = step.description || "";
  const skillTexts = step.skills || [];

  let titleMatches = 0;
  let descMatches = 0;
  let skillMatches = 0;

  for (const tag of resource.topicTags) {
    if (matchesTag(titleText, tag)) {
      titleMatches++;
    }
    if (matchesTag(descText, tag)) {
      descMatches++;
    }
    for (const skill of skillTexts) {
      if (matchesTag(skill, tag)) {
        skillMatches++;
      }
    }
  }

  // If a resource matches NO topicTags in step title and NO topicTags in step description,
  // reject it (score = 0) regardless of any generic student/step skills.
  if (titleMatches === 0 && descMatches === 0) {
    return 0;
  }

  return titleMatches * 5 + descMatches * 2 + skillMatches * 1;
}

/**
 * Deterministically find topic-specific resources for a roadmap step.
 *
 * Supports tracking used resource URLs across the entire roadmap to prevent duplicates.
 */
export function findCuratedResources(
  stepInput: StepMatchInput | string,
  arg2?: string[] | Set<string>,
  arg3?: string | Set<string>,
  arg4?: Set<string>
): { videos: VideoResource[]; extraResources: ExtraResource[] } {
  let step: StepMatchInput;
  let usedVideoUrls: Set<string> = new Set();
  let usedExtraUrls: Set<string> = new Set();

  if (typeof stepInput === "string") {
    // Backward-compatible invocation: (stepTitle, stepSkills, stepDesc, usedVideoUrls)
    step = {
      title: stepInput,
      skills: Array.isArray(arg2) ? arg2 : [],
      description: typeof arg3 === "string" ? arg3 : "",
    };
    if (arg3 instanceof Set) usedVideoUrls = arg3;
    if (arg4 instanceof Set) usedExtraUrls = arg4;
  } else {
    step = stepInput;
    if (arg2 instanceof Set) usedVideoUrls = arg2;
    if (arg3 instanceof Set) usedExtraUrls = arg3;
  }

  // Calculate scores for all catalog resources
  const scoredResources = RESOURCE_CATALOG.map((resource) => ({
    resource,
    score: scoreResourceForStep(resource, step),
  })).filter((item) => item.score >= MIN_RELEVANCE_SCORE);

  // Sort descending by relevance score
  scoredResources.sort((a, b) => b.score - a.score);

  // Separate videos and extra resources
  const videoCandidates = scoredResources.filter((item) => item.resource.type === "video");
  const extraCandidates = scoredResources.filter((item) => item.resource.type !== "video");

  // Selection helper with deduplication logic
  function pickResources<T extends VideoResource | ExtraResource>(
    candidates: { resource: CuratedResource; score: number }[],
    usedUrls: Set<string>,
    transform: (res: CuratedResource) => T,
    maxCount = 2
  ): T[] {
    const selected: T[] = [];

    // 1. Pick unused relevant candidates first
    for (const item of candidates) {
      if (selected.length >= maxCount) break;
      if (!usedUrls.has(item.resource.url)) {
        selected.push(transform(item.resource));
      }
    }

    // 2. If we haven't reached maxCount and have space, allow reuse ONLY if score is exceptionally high
    if (selected.length < maxCount) {
      for (const item of candidates) {
        if (selected.length >= maxCount) break;
        if (usedUrls.has(item.resource.url) && item.score >= HIGH_RELEVANCE_SCORE_FOR_REUSE) {
          const transformed = transform(item.resource);
          // Avoid duplicate within the same step's response
          if (!selected.some((s) => s.url === transformed.url)) {
            selected.push(transformed);
          }
        }
      }
    }

    return selected;
  }

  const selectedVideos = pickResources<VideoResource>(
    videoCandidates,
    usedVideoUrls,
    (res) => ({
      title: res.title,
      channel: res.channel || res.provider,
      url: res.url,
    }),
    2
  );

  const selectedExtras = pickResources<ExtraResource>(
    extraCandidates,
    usedExtraUrls,
    (res) => ({
      title: res.title,
      url: res.url,
      type: res.type,
    }),
    2
  );

  return {
    videos: selectedVideos,
    extraResources: selectedExtras,
  };
}
