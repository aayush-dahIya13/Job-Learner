import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIdx = trimmed.indexOf("=");
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env.local:", e);
}

describe("Apply Migration 013 to Live Database", () => {
  it("executes migration 013 schema updates", async () => {
    const { query } = await import("@/lib/db");

    // 1. Update users constraint
    await query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    await query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin', 'company'))");

    // 2. Create company_profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(120) NOT NULL,
        company_size VARCHAR(50),
        website VARCHAR(255),
        contact_person VARCHAR(160) NOT NULL,
        contact_phone VARCHAR(30) NOT NULL,
        description TEXT,
        verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 3. Create indexes
    await query("CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON company_profiles(user_id)");
    await query("CREATE INDEX IF NOT EXISTS company_profiles_verification_status_idx ON company_profiles(verification_status)");

    // 4. Verify table exists
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_name = 'company_profiles'");
    expect(res.rows.length).toBe(1);
  }, 30000);
});
