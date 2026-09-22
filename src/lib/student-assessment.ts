import { query, withTransaction } from "@/lib/db";

export type AssessmentQuestionOption = {
  id: number;
  optionText: string;
  optionOrder: number;
};

export type AssessmentQuestion = {
  id: number;
  skillId: number;
  skillName: string;
  questionType: "mcq" | "multiple_select" | "code_output" | "debugging";
  questionText: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  options: AssessmentQuestionOption[];
};

export type AssessmentDetail = {
  id: number;
  jobRoleId: number | null;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  version: number;
};

export type AssessmentAttemptSummary = {
  id: number;
  assessmentId: number;
  assessmentTitle: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  percentage: number | null;
  status: "in_progress" | "completed" | "abandoned";
  attemptNumber: number;
};

import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  resolveCurrentDemonstratedSkill,
  type DemonstratedLevelLabel,
  type DemonstratedSkillAttempt,
} from "@/lib/proficiency";

export type SkillAssessmentResult = {
  skillId: number;
  skillName: string;
  score: number;
  percentage: number;
  demonstratedLevel: number;
  levelLabel: DemonstratedLevelLabel;
  questionsAttempted: number;
  questionsCorrect: number;
};



// Fetch active assessment for a job role
export async function getActiveAssessmentForRole(jobRoleId: number): Promise<AssessmentDetail | null> {
  const result = await query<{
    id: number;
    job_role_id: number | null;
    title: string;
    description: string | null;
    duration_minutes: number;
    total_questions: number;
    passing_score: number;
    version: number;
  }>(
    `SELECT id::integer AS id, job_role_id::integer AS job_role_id, title, description, 
            duration_minutes, total_questions, passing_score, version 
     FROM assessments 
     WHERE job_role_id = $1 AND status = 'active' 
     ORDER BY version DESC LIMIT 1`,
    [jobRoleId]
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    jobRoleId: row.job_role_id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    totalQuestions: row.total_questions,
    passingScore: row.passing_score,
    version: row.version,
  };
}

// Fetch active attempt for a student if one exists
export async function getActiveStudentAttempt(userId: number, assessmentId?: number) {
  const sql = assessmentId
    ? `SELECT id::integer AS id, assessment_id::integer AS assessment_id, started_at, attempt_number, status 
       FROM assessment_attempts 
       WHERE user_id = $1 AND assessment_id = $2 AND status = 'in_progress' 
       ORDER BY id DESC LIMIT 1`
    : `SELECT id::integer AS id, assessment_id::integer AS assessment_id, started_at, attempt_number, status 
       FROM assessment_attempts 
       WHERE user_id = $1 AND status = 'in_progress' 
       ORDER BY id DESC LIMIT 1`;
  const params = assessmentId ? [userId, assessmentId] : [userId];
  const result = await query<{
    id: number;
    assessment_id: number;
    started_at: Date;
    attempt_number: number;
    status: string;
  }>(sql, params);
  return result.rows[0] ?? null;
}

// Start a new assessment attempt for a student
export async function startAssessmentAttempt(userId: number, assessmentId: number) {
  return withTransaction(async (client) => {
    // Check for existing active attempt
    const existing = await client.query<{ id: number }>(
      `SELECT id::integer AS id FROM assessment_attempts 
       WHERE user_id = $1 AND assessment_id = $2 AND status = 'in_progress' LIMIT 1`,
      [userId, assessmentId]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    // Get latest attempt number
    const countRes = await client.query<{ max_attempt: number }>(
      `SELECT COALESCE(MAX(attempt_number), 0)::integer AS max_attempt 
       FROM assessment_attempts WHERE user_id = $1 AND assessment_id = $2`,
      [userId, assessmentId]
    );
    const nextAttemptNumber = (countRes.rows[0]?.max_attempt ?? 0) + 1;

    const newAttempt = await client.query<{ id: number }>(
      `INSERT INTO assessment_attempts (user_id, assessment_id, started_at, status, attempt_number) 
       VALUES ($1, $2, NOW(), 'in_progress', $3) RETURNING id::integer AS id`,
      [userId, assessmentId, nextAttemptNumber]
    );
    return newAttempt.rows[0].id;
  });
}

// Fetch questions for an assessment attempt (SECURE: options exclude is_correct flag!)
export async function getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
  const qResult = await query<{
    id: number;
    skill_id: number;
    skill_name: string;
    question_type: "mcq" | "multiple_select" | "code_output" | "debugging";
    question_text: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    points: number;
  }>(
    `SELECT aq.id::integer AS id, aq.skill_id::integer AS skill_id, s.name AS skill_name,
            aq.question_type, aq.question_text, aq.difficulty, aq.points
     FROM assessment_questions aq
     JOIN skills s ON s.id = aq.skill_id
     WHERE aq.assessment_id = $1
     ORDER BY aq.id ASC`,
    [assessmentId]
  );

  if (!qResult.rows.length) return [];

  const questionIds = qResult.rows.map((q) => q.id);
  const optResult = await query<{
    id: number;
    question_id: number;
    option_text: string;
    option_order: number;
  }>(
    `SELECT id::integer AS id, question_id::integer AS question_id, option_text, option_order
     FROM assessment_question_options
     WHERE question_id = ANY($1::bigint[])
     ORDER BY question_id, option_order ASC`,
    [questionIds]
  );

  const optionsMap = new Map<number, AssessmentQuestionOption[]>();
  for (const opt of optResult.rows) {
    const list = optionsMap.get(opt.question_id) ?? [];
    list.push({ id: opt.id, optionText: opt.option_text, optionOrder: opt.option_order });
    optionsMap.set(opt.question_id, list);
  }

  return qResult.rows.map((q) => ({
    id: q.id,
    skillId: q.skill_id,
    skillName: q.skill_name,
    questionType: q.question_type,
    questionText: q.question_text,
    difficulty: q.difficulty,
    points: q.points,
    options: optionsMap.get(q.id) ?? [],
  }));
}

// Submit and server-side grade an assessment attempt
export async function submitAssessmentAttempt(
  userId: number,
  attemptId: number,
  answers: { questionId: number; selectedOptionId: number | null }[]
) {
  return withTransaction(async (client) => {
    // Validate attempt ownership & status
    const attemptRes = await client.query<{
      id: number;
      user_id: number;
      assessment_id: number;
      status: string;
    }>(
      `SELECT id::integer AS id, user_id::integer AS user_id, assessment_id::integer AS assessment_id, status 
       FROM assessment_attempts WHERE id = $1 FOR UPDATE`,
      [attemptId]
    );

    const attempt = attemptRes.rows[0];
    if (!attempt) throw new Error("Assessment attempt not found.");
    if (attempt.user_id !== userId) throw new Error("Unauthorized attempt submission.");
    if (attempt.status !== "in_progress") throw new Error("This assessment attempt has already been submitted.");

    // Fetch correct options for grading
    const qRes = await client.query<{
      id: number;
      skill_id: number;
      points: number;
      correct_option_id: number;
    }>(
      `SELECT aq.id::integer AS id, aq.skill_id::integer AS skill_id, aq.points,
              aqo.id::integer AS correct_option_id
       FROM assessment_questions aq
       JOIN assessment_question_options aqo ON aqo.question_id = aq.id AND aqo.is_correct = TRUE
       WHERE aq.assessment_id = $1`,
      [attempt.assessment_id]
    );

    const questionMap = new Map(
      qRes.rows.map((q) => [
        q.id,
        { skillId: q.skill_id, points: q.points, correctOptionId: q.correct_option_id },
      ])
    );

    let totalPointsEarned = 0;
    let totalPossiblePoints = 0;

    const skillStats = new Map<
      number,
      { attempted: number; correct: number; pointsEarned: number; possiblePoints: number }
    >();

    // Process each answer
    for (const ans of answers) {
      const qInfo = questionMap.get(ans.questionId);
      if (!qInfo) continue;

      const isCorrect = ans.selectedOptionId !== null && ans.selectedOptionId === qInfo.correctOptionId;
      const pointsEarned = isCorrect ? qInfo.points : 0;

      totalPossiblePoints += qInfo.points;
      if (isCorrect) totalPointsEarned += pointsEarned;

      // Save answer
      await client.query(
        `INSERT INTO assessment_answers (attempt_id, question_id, selected_option_id, is_correct, points_earned, answered_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (attempt_id, question_id) DO UPDATE 
         SET selected_option_id = EXCLUDED.selected_option_id,
             is_correct = EXCLUDED.is_correct,
             points_earned = EXCLUDED.points_earned,
             answered_at = NOW()`,
        [attemptId, ans.questionId, ans.selectedOptionId, isCorrect, pointsEarned]
      );

      // Aggregate skill stats
      const stats = skillStats.get(qInfo.skillId) ?? { attempted: 0, correct: 0, pointsEarned: 0, possiblePoints: 0 };
      stats.attempted += 1;
      if (isCorrect) stats.correct += 1;
      stats.pointsEarned += pointsEarned;
      stats.possiblePoints += qInfo.points;
      skillStats.set(qInfo.skillId, stats);
    }

    const overallPercentage = totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0;

    // Update attempt completion status
    await client.query(
      `UPDATE assessment_attempts 
       SET completed_at = NOW(), score = $1, percentage = $2, status = 'completed'
       WHERE id = $3`,
      [totalPointsEarned, overallPercentage, attemptId]
    );

    // Save skill assessment results
    for (const [skillId, stats] of skillStats.entries()) {
      const skillPercentage = stats.possiblePoints > 0 ? Math.round((stats.pointsEarned / stats.possiblePoints) * 100) : 0;
      const demonstratedLevel = percentageToDemonstratedLevel(skillPercentage);

      await client.query(
        `INSERT INTO skill_assessment_results (attempt_id, user_id, skill_id, score, percentage, demonstrated_level, questions_attempted, questions_correct, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (attempt_id, skill_id) DO UPDATE
         SET score = EXCLUDED.score, percentage = EXCLUDED.percentage, demonstrated_level = EXCLUDED.demonstrated_level,
             questions_attempted = EXCLUDED.questions_attempted, questions_correct = EXCLUDED.questions_correct`,
        [attemptId, userId, skillId, stats.pointsEarned, skillPercentage, demonstratedLevel, stats.attempted, stats.correct]
      );
    }

    return { attemptId, score: totalPointsEarned, percentage: overallPercentage };
  });
}

// Fetch detailed assessment attempt result for display
export async function getAttemptDetails(userId: number, attemptId: number) {
  const attemptRes = await query<{
    id: number;
    assessment_id: number;
    assessment_title: string;
    started_at: Date;
    completed_at: Date | null;
    score: string | null;
    percentage: string | null;
    status: string;
    attempt_number: number;
  }>(
    `SELECT aa.id::integer AS id, aa.assessment_id::integer AS assessment_id, a.title AS assessment_title,
            aa.started_at, aa.completed_at, aa.score::text, aa.percentage::text, aa.status, aa.attempt_number
     FROM assessment_attempts aa
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE aa.id = $1 AND aa.user_id = $2`,
    [attemptId, userId]
  );

  const attempt = attemptRes.rows[0];
  if (!attempt) return null;

  // Fetch skill results
  const skillRes = await query<{
    skill_id: number;
    skill_name: string;
    score: string;
    percentage: string;
    demonstrated_level: number;
    questions_attempted: number;
    questions_correct: number;
  }>(
    `SELECT sar.skill_id::integer AS skill_id, s.name AS skill_name, sar.score::text, sar.percentage::text,
            sar.demonstrated_level, sar.questions_attempted, sar.questions_correct
     FROM skill_assessment_results sar
     JOIN skills s ON s.id = sar.skill_id
     WHERE sar.attempt_id = $1
     ORDER BY sar.percentage ASC, s.name ASC`,
    [attemptId]
  );

  // Fetch self-reported skills for comparison
  const selfReportedRes = await query<{ skill_id: number; proficiency_level: number }>(
    `SELECT skill_id::integer AS skill_id, proficiency_level FROM student_skills WHERE user_id = $1`,
    [userId]
  );
  const selfMap = new Map(selfReportedRes.rows.map((s) => [s.skill_id, s.proficiency_level]));

  const skillResults: (SkillAssessmentResult & { selfReportedLevel: number | null })[] = skillRes.rows.map((sr) => {
    const pct = Number(sr.percentage);
    return {
      skillId: sr.skill_id,
      skillName: sr.skill_name,
      score: Number(sr.score),
      percentage: pct,
      demonstratedLevel: sr.demonstrated_level,
      levelLabel: getDemonstratedLevelLabel(pct),
      questionsAttempted: sr.questions_attempted,
      questionsCorrect: sr.questions_correct,
      selfReportedLevel: selfMap.get(sr.skill_id) ?? null,
    };
  });

  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessment_id,
    title: attempt.assessment_title,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    score: attempt.score ? Number(attempt.score) : null,
    percentage: attempt.percentage ? Number(attempt.percentage) : null,
    status: attempt.status,
    attemptNumber: attempt.attempt_number,
    skillResults,
  };
}

// Fetch latest demonstrated skills for a student
export async function getLatestDemonstratedSkills(userId: number) {
  const result = await query<{
    skill_id: number;
    skill_name: string;
    percentage: string;
    demonstrated_level: number;
    attempt_id: number;
    completed_at: Date;
  }>(
    `SELECT DISTINCT ON (sar.skill_id)
            sar.skill_id::integer AS skill_id, s.name AS skill_name, sar.percentage::text,
            sar.demonstrated_level, sar.attempt_id::integer AS attempt_id, aa.completed_at
     FROM skill_assessment_results sar
     JOIN skills s ON s.id = sar.skill_id
     JOIN assessment_attempts aa ON aa.id = sar.attempt_id
     WHERE sar.user_id = $1 AND aa.status = 'completed'
     ORDER BY sar.skill_id, aa.completed_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    skillId: row.skill_id,
    skillName: row.skill_name,
    percentage: Number(row.percentage),
    demonstratedLevel: row.demonstrated_level,
    levelLabel: getDemonstratedLevelLabel(Number(row.percentage)),
    attemptId: row.attempt_id,
    completedAt: row.completed_at,
  }));
}

export type MilestoneAssessmentItem = {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  skillsTested: string[];
  status: "not_started" | "in_progress" | "completed";
  latestAttemptId: number | null;
  latestScore: number | null;
  latestPercentage: number | null;
  completedAt: Date | string | null;
};

export async function getMilestoneAssessmentsForUser(userId: number, jobRoleId: number): Promise<MilestoneAssessmentItem[]> {
  const assResult = await query<{
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    total_questions: number;
    passing_score: number;
  }>(
    `SELECT id::integer AS id, title, description, duration_minutes, total_questions, passing_score
     FROM assessments
     WHERE job_role_id = $1 AND assessment_type = 'milestone' AND status = 'active'
     ORDER BY id ASC`,
    [jobRoleId]
  );

  if (assResult.rows.length === 0) return [];

  const assessmentIds = assResult.rows.map((a) => a.id);

  const skillsRes = await query<{ assessment_id: number; skill_name: string }>(
    `SELECT DISTINCT aq.assessment_id::integer AS assessment_id, s.name AS skill_name
     FROM assessment_questions aq
     JOIN skills s ON s.id = aq.skill_id
     WHERE aq.assessment_id = ANY($1::bigint[])
     ORDER BY aq.assessment_id, s.name`,
    [assessmentIds]
  );

  const skillsMap = new Map<number, string[]>();
  for (const row of skillsRes.rows) {
    const list = skillsMap.get(row.assessment_id) ?? [];
    list.push(row.skill_name);
    skillsMap.set(row.assessment_id, list);
  }

  const attemptsRes = await query<{
    id: number;
    assessment_id: number;
    score: string | null;
    percentage: string | null;
    status: string;
    completed_at: Date | null;
  }>(
    `SELECT id::integer AS id, assessment_id::integer AS assessment_id, score::text, percentage::text, status, completed_at
     FROM assessment_attempts
     WHERE user_id = $1 AND assessment_id = ANY($2::bigint[])
     ORDER BY id DESC`,
    [userId, assessmentIds]
  );

  const attemptsMap = new Map<number, { id: number; score: number | null; percentage: number | null; status: string; completedAt: Date | null }>();
  for (const att of attemptsRes.rows) {
    if (!attemptsMap.has(att.assessment_id)) {
      attemptsMap.set(att.assessment_id, {
        id: att.id,
        score: att.score !== null ? Number(att.score) : null,
        percentage: att.percentage !== null ? Number(att.percentage) : null,
        status: att.status,
        completedAt: att.completed_at,
      });
    }
  }

  return assResult.rows.map((a) => {
    const att = attemptsMap.get(a.id);
    let status: "not_started" | "in_progress" | "completed" = "not_started";
    if (att) {
      if (att.status === "completed") status = "completed";
      else if (att.status === "in_progress") status = "in_progress";
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      durationMinutes: a.duration_minutes,
      totalQuestions: a.total_questions,
      passingScore: a.passing_score,
      skillsTested: skillsMap.get(a.id) ?? [],
      status,
      latestAttemptId: att ? att.id : null,
      latestScore: att ? att.score : null,
      latestPercentage: att ? att.percentage : null,
      completedAt: att ? att.completedAt : null,
    };
  });
}

export type SkillProgressHistory = {
  skillId: number;
  skillName: string;
  selfReportedLevel: number | null;
  diagnosticPercentage: number | null;
  diagnosticLevel: number | null;
  latestPercentage: number | null;
  latestDemonstratedLevel: number | null;
  latestLevelLabel: DemonstratedLevelLabel | null;
  improvementPercentage: number | null;
  attempts: {
    attemptId: number;
    assessmentTitle: string;
    assessmentType: string;
    percentage: number;
    demonstratedLevel: number;
    completedAt: Date | string;
  }[];
};

export async function getSkillProgressHistory(userId: number): Promise<SkillProgressHistory[]> {
  const historyRes = await query<{
    skill_id: number;
    skill_name: string;
    attempt_id: number;
    assessment_title: string;
    assessment_type: string;
    percentage: string;
    demonstrated_level: number;
    completed_at: Date;
  }>(
    `SELECT sar.skill_id::integer AS skill_id, s.name AS skill_name,
            sar.attempt_id::integer AS attempt_id, a.title AS assessment_title,
            a.assessment_type, sar.percentage::text, sar.demonstrated_level,
            aa.completed_at
     FROM skill_assessment_results sar
     JOIN skills s ON s.id = sar.skill_id
     JOIN assessment_attempts aa ON aa.id = sar.attempt_id
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE sar.user_id = $1 AND aa.status = 'completed'
     ORDER BY s.name ASC, aa.completed_at ASC`,
    [userId]
  );

  const selfRes = await query<{ skill_id: number; proficiency_level: number }>(
    `SELECT skill_id::integer AS skill_id, proficiency_level FROM student_skills WHERE user_id = $1`,
    [userId]
  );
  const selfMap = new Map(selfRes.rows.map((s) => [s.skill_id, s.proficiency_level]));

  const map = new Map<number, {
    skillId: number;
    skillName: string;
    attempts: {
      attemptId: number;
      assessmentTitle: string;
      assessmentType: string;
      percentage: number;
      demonstratedLevel: number;
      completedAt: Date | string;
    }[];
  }>();

  for (const row of historyRes.rows) {
    const existing = map.get(row.skill_id) ?? {
      skillId: row.skill_id,
      skillName: row.skill_name,
      attempts: [],
    };

    existing.attempts.push({
      attemptId: row.attempt_id,
      assessmentTitle: row.assessment_title,
      assessmentType: row.assessment_type,
      percentage: Number(row.percentage),
      demonstratedLevel: row.demonstrated_level,
      completedAt: row.completed_at,
    });

    map.set(row.skill_id, existing);
  }

  const result: SkillProgressHistory[] = [];

  for (const [skillId, data] of map.entries()) {
    const selfReportedLevel = selfMap.get(skillId) ?? null;
    const diag = data.attempts.find((a) => a.assessmentType === "diagnostic") ?? data.attempts[0];
    const latest = data.attempts[data.attempts.length - 1];

    const diagnosticPercentage = diag ? diag.percentage : null;
    const diagnosticLevel = diag ? diag.demonstratedLevel : null;
    const latestPercentage = latest ? latest.percentage : null;
    const latestDemonstratedLevel = latest ? latest.demonstratedLevel : null;
    const latestLevelLabel = latestPercentage !== null ? getDemonstratedLevelLabel(latestPercentage) : null;

    const improvementPercentage =
      latestPercentage !== null && diagnosticPercentage !== null
        ? latestPercentage - diagnosticPercentage
        : null;

    result.push({
      skillId,
      skillName: data.skillName,
      selfReportedLevel,
      diagnosticPercentage,
      diagnosticLevel,
      latestPercentage,
      latestDemonstratedLevel,
      latestLevelLabel,
      improvementPercentage,
      attempts: data.attempts,
    });
  }

  return result;
}
