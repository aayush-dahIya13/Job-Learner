// Tests for proficiency utilities
import { expect, test, describe } from 'vitest';
import { percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  levelToDemonstratedLevelLabel,
  getProficiencyDetails,
  resolveCurrentDemonstratedSkill,
  resolveEffectiveSkillState,
  type DemonstratedSkillAttempt,
} from '../proficiency';

describe('percentageToDemonstratedLevel', () => {
  const cases: [number, number][] = [
    [0, 1],
    [39, 1],
    [40, 2],
    [59, 2],
    [60, 3],
    [74, 3],
    [75, 4],
    [89, 4],
    [90, 5],
    [100, 5],
    [-10, 1],
    [150, 5],
  ];
  for (const [input, expected] of cases) {
    test(`percentage ${input} → level ${expected}`, () => {
      expect(percentageToDemonstratedLevel(input)).toBe(expected);
    });
  }
});

describe('label conversion', () => {
  test('getDemonstratedLevelLabel matches level mapping', () => {
    expect(getDemonstratedLevelLabel(0)).toBe('Beginner');
    expect(getDemonstratedLevelLabel(45)).toBe('Developing');
    expect(getDemonstratedLevelLabel(65)).toBe('Proficient');
    expect(getDemonstratedLevelLabel(80)).toBe('Advanced');
    expect(getDemonstratedLevelLabel(95)).toBe('Expert');
  });
  test('levelToDemonstratedLevelLabel works for bounds', () => {
    expect(levelToDemonstratedLevelLabel(1)).toBe('Beginner');
    expect(levelToDemonstratedLevelLabel(3)).toBe('Proficient');
    expect(levelToDemonstratedLevelLabel(5)).toBe('Expert');
    // out of range clamped
    expect(levelToDemonstratedLevelLabel(0)).toBe('Beginner');
    expect(levelToDemonstratedLevelLabel(6)).toBe('Expert');
  });
});

describe('getProficiencyDetails', () => {
  test('returns correct band info', () => {
    const details = getProficiencyDetails(62);
    expect(details.level).toBe(3);
    expect(details.label).toBe('Proficient');
    expect(details.band.minScore).toBe(60);
    expect(details.band.maxScore).toBe(74);
  });
});

describe('resolveCurrentDemonstratedSkill', () => {
  test('picks latest by completedAt', () => {
    const attempts: DemonstratedSkillAttempt[] = [
      { attemptId: 1, assessmentId: 1, assessmentTitle: 'A', assessmentType: 'quiz', score: 10, percentage: 10, demonstratedLevel: 1, levelLabel: 'Beginner', completedAt: '2023-01-01T00:00:00Z' },
      { attemptId: 2, assessmentId: 1, assessmentTitle: 'A', assessmentType: 'quiz', score: 80, percentage: 80, demonstratedLevel: 4, levelLabel: 'Advanced', completedAt: '2023-02-01T00:00:00Z' },
    ];
    const latest = resolveCurrentDemonstratedSkill(attempts);
    expect(latest?.attemptId).toBe(2);
  });
  test('returns null for empty list', () => {
    expect(resolveCurrentDemonstratedSkill([])).toBeNull();
  });
});

describe('resolveEffectiveSkillState', () => {
  test('uses demonstrated when present', () => {
    const latest = {
      attemptId: 1,
      assessmentId: 1,
      assessmentTitle: 'A',
      assessmentType: 'quiz',
      score: 70,
      percentage: 70,
      demonstratedLevel: 3,
      levelLabel: 'Proficient',
      completedAt: new Date().toISOString(),
    } as any;
    const result = resolveEffectiveSkillState({
      skillId: 10,
      skillName: 'SkillX',
      latestDemonstrated: latest,
      selfReportedLevel: 2,
      requiredLevel: 3,
    });
    expect(result.effectiveLevel).toBe(3);
    expect(result.source).toBe('DEMONSTRATED');
    expect(result.status).toBe('MEETS_REQUIREMENT');
  });
  test('falls back to self‑reported', () => {
    const result = resolveEffectiveSkillState({
      skillId: 11,
      skillName: 'SkillY',
      latestDemonstrated: null,
      selfReportedLevel: 2,
      requiredLevel: 3,
    });
    expect(result.effectiveLevel).toBe(2);
    expect(result.source).toBe('SELF_REPORTED');
    expect(result.status).toBe('needs_improvement');
  });
  test('unassessed when no data', () => {
    const result = resolveEffectiveSkillState({
      skillId: 12,
      skillName: 'SkillZ',
      latestDemonstrated: null,
      selfReportedLevel: null,
      requiredLevel: null,
    });
    expect(result.source).toBe('UNASSESSED');
    expect(result.status).toBe('UNVERIFIED');
  });
});
