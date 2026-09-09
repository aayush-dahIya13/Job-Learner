import { z } from "zod";
import { CURRENT_YEARS } from "@/lib/constants";

const phone = z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid contact number.");

const registrationCurrentYear = z
  .enum(["1st Year", "2nd Year", "3rd Year", "4th Year"], {
    errorMap: () => ({ message: "Please select a valid current year." }),
  })
  .transform((year) => ({
    "1st Year": 1,
    "2nd Year": 2,
    "3rd Year": 3,
    "4th Year": 4,
  })[year]);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
  confirmPassword: z.string(),
  contactNumber: phone,
  collegeId: z.coerce.number().int().positive("Please select a college."),
  branchId: z.coerce.number().int().positive("Please select a branch."),
  currentYear: registrationCurrentYear,
  careerGoal: z.string().trim().min(10, "Tell us a little more about your career goal.").max(1000),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(160),
  contactNumber: phone,
  collegeId: z.coerce.number().int().positive("Please select a college."),
  branchId: z.coerce.number().int().positive("Please select a branch."),
  currentYear: z.coerce.number().int().min(1, "Please select a valid current year.").max(4, "Please select a valid current year."),
  careerGoal: z.string().trim().min(10, "Tell us a little more about your career goal.").max(1000),
});
