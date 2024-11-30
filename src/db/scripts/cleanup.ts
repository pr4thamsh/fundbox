import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const dbUrl =
  process.argv[2] === "--supabase"
    ? process.env.SUPABASE_DB_URL
    : process.env.LOCAL_DB_URL;

if (!dbUrl) {
  console.error("❌ Database URL not found in environment variables");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool);

async function cleanup() {
  try {
    console.log("🧹 Starting data cleanup...");

    await db.execute(sql`
      DO $$ 
      BEGIN
        TRUNCATE TABLE 
          orders,
          draws,
          fundraisers,
          supporters
        CASCADE;
        
        ALTER SEQUENCE supporters_id_seq RESTART WITH 1;
        ALTER SEQUENCE fundraisers_id_seq RESTART WITH 1;
        ALTER SEQUENCE draws_id_seq RESTART WITH 1;
        ALTER SEQUENCE orders_id_seq RESTART WITH 1;
      END $$;
    `);

    console.log(
      "✨ Test data cleared while preserving organizations and admins!",
    );
    await pool.end();
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    await pool.end();
    process.exit(1);
  }
}

cleanup();
