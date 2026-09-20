import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { query } from "./src/lib/db";
import { loadAiStudentContext, safeAiInput } from "./src/lib/ai/student-context";
import { generateRoadmap } from "./src/lib/ai/gemini";
import { saveRoadmap } from "./src/lib/ai/store";

async function run() {
  try {
    const usersRes = await query<{ id: number; email: string }>("SELECT id::integer AS id, email FROM users LIMIT 5");
    console.log("Users in DB:", usersRes.rows);

    if (usersRes.rows.length === 0) {
      console.log("No users found.");
      process.exit(0);
    }

    const userId = usersRes.rows[0].id;
    console.log(`Testing loadAiStudentContext for user ID: ${userId} (${usersRes.rows[0].email})...`);

    const context = await loadAiStudentContext(userId);
    console.log("Context loaded successfully!");
    console.log("Safe AI Input:", JSON.stringify(safeAiInput(context), null, 2));

    console.log("Generating roadmap with Gemini...");
    const roadmap = await generateRoadmap(context);
    console.log("Roadmap generated successfully!");

    console.log("Saving roadmap...");
    await saveRoadmap(userId, context.career.id, context.skillGap.readinessScore, roadmap);
    console.log("Roadmap saved successfully!");

  } catch (err) {
    console.error("EXACT ERROR REPRODUCED:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
