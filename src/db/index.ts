import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createOrderEmailTrigger } from "./email-triggers";
import { createPickWinnerProcedure } from "./pick-winner";

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: queryClient });

export async function setupDatabase() {
  try {
    await db.execute(createPickWinnerProcedure);
    console.log("🎲 Lucky draw procedure created successfully");
    await db.execute(createOrderEmailTrigger);
    console.log("📧 Email triggers setup successfully");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
}
