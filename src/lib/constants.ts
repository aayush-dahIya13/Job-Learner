export const CURRENT_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"] as const;

// Used before a database is configured, and mirrors the seed data.
// Forms fetch database data when it is available.
export const SAMPLE_COLLEGES = [
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Madras",
  "National Institute of Technology Tiruchirappalli",
  "Delhi Technological University",
  "Vellore Institute of Technology",
  "Manipal Institute of Technology",
  "Pune Institute of Computer Technology",
];

export const SAMPLE_BRANCHES = [
  "Computer Science", "Information Technology", "Electronics and Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Artificial Intelligence / Data Science", "Other",
];
