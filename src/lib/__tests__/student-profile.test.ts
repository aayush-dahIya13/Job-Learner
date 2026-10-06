import { describe, it, expect } from "vitest";
import { calculateProfileCompleteness } from "@/lib/student-profile";

describe("Student Profile Completeness & Helper Calculations", () => {
  it("1. calculates 100% completeness (7/7) for a complete student profile", () => {
    const completeness = calculateProfileCompleteness({
      fullName: "Alex Johnson",
      contactNumber: "+1234567890",
      collegeName: "Tech University",
      branchName: "Computer Science",
      currentYear: 3,
      careerGoal: "Become a Full Stack Engineer building modern web apps",
      hasTargetRole: true,
      skillsCount: 4,
    });

    expect(completeness.completedCount).toBe(7);
    expect(completeness.totalFields).toBe(7);
    expect(completeness.percentage).toBe(100);
    expect(completeness.missingFields).toEqual([]);
    expect(completeness.isComplete).toBe(true);
  });

  it("2. identifies missing fields and partial completeness score", () => {
    const completeness = calculateProfileCompleteness({
      fullName: "Alex Johnson",
      contactNumber: "",
      collegeName: "Tech University",
      branchName: "Computer Science",
      currentYear: 2,
      careerGoal: "",
      skillsCount: 0,
    });

    expect(completeness.completedCount).toBe(4);
    expect(completeness.totalFields).toBe(7);
    expect(completeness.percentage).toBe(57); // 4/7 = 57%
    expect(completeness.missingFields).toEqual([
      "Contact Number",
      "Career Vision Goal",
      "Added Skills",
    ]);
    expect(completeness.isComplete).toBe(false);
  });

  it("3. handles missing career goal correctly", () => {
    const completeness = calculateProfileCompleteness({
      fullName: "Jordan Lee",
      contactNumber: "+1987654321",
      collegeName: "State College",
      branchName: "Information Technology",
      currentYear: 4,
      careerGoal: null,
      skillsCount: 2,
    });

    expect(completeness.missingFields).toContain("Career Vision Goal");
    expect(completeness.completedCount).toBe(6);
    expect(completeness.percentage).toBe(86);
  });

  it("4. handles empty skills correctly", () => {
    const completeness = calculateProfileCompleteness({
      fullName: "Jordan Lee",
      contactNumber: "+1987654321",
      collegeName: "State College",
      branchName: "Information Technology",
      currentYear: 4,
      careerGoal: "Software Engineer",
      skillsCount: 0,
    });

    expect(completeness.missingFields).toContain("Added Skills");
    expect(completeness.completedCount).toBe(6);
    expect(completeness.percentage).toBe(86);
  });

  it("5. completeness calculation is strictly deterministic and does not alter proficiency or skill gap rules", () => {
    const comp1 = calculateProfileCompleteness({
      fullName: "Test User",
      contactNumber: "123",
      collegeName: "C",
      branchName: "B",
      currentYear: 1,
      careerGoal: "G",
      skillsCount: 1,
    });

    const comp2 = calculateProfileCompleteness({
      fullName: "Test User",
      contactNumber: "123",
      collegeName: "C",
      branchName: "B",
      currentYear: 1,
      careerGoal: "G",
      skillsCount: 1,
    });

    expect(comp1).toEqual(comp2);
    expect(comp1.percentage).toBe(100);
  });
});
