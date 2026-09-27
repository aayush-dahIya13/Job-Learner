// Tests for skill-gap calculation
import { expect, test, describe } from 'vitest';
import { calculateSkillGap } from '../skill-gap';

type RequiredSkill = { skillId: number; skillName: string; requiredLevel: number; importance: number };
type StudentSkillLevel = { skillId: number; proficiencyLevel: number };

describe('calculateSkillGap', () => {
  const jobRole = { id: 1, title: 'Engineer' } as any;
  const requiredSkills: RequiredSkill[] = [
    { skillId: 1, skillName: 'SkillA', requiredLevel: 3, importance: 5 },
    { skillId: 2, skillName: 'SkillB', requiredLevel: 2, importance: 3 },
    { skillId: 3, skillName: 'SkillC', requiredLevel: 4, importance: 2 },
  ];

  test('mastered, needs improvement, missing', () => {
    const studentSkills: StudentSkillLevel[] = [
      { skillId: 1, proficiencyLevel: 4 }, // mastered (>= required)
      { skillId: 2, proficiencyLevel: 1 }, // needs improvement ( >0 but < required)
      // skillId 3 missing
    ];
    const result = calculateSkillGap(jobRole, requiredSkills, studentSkills);
    expect(result.summary.masteredSkills).toBe(1);
    expect(result.summary.needsImprovement).toBe(1);
    expect(result.summary.missingSkills).toBe(1);
    // readinessScore should be weighted: (skill1:5*1) + (skill2:3*0.5) = 5 + 1.5 = 6.5 / totalImportance 10 = 0.65 => 65
    expect(result.readinessScore).toBe(65);
  });

  test('no skills at all', () => {
    const result = calculateSkillGap(jobRole, requiredSkills, []);
    expect(result.summary.masteredSkills).toBe(0);
    expect(result.summary.needsImprovement).toBe(0);
    expect(result.summary.missingSkills).toBe(3);
    expect(result.readinessScore).toBe(0);
  });
});
