import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createPickWinnerProcedure } from './schema/draws';

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: queryClient });

export async function setupDatabase() {
    await db.execute(createPickWinnerProcedure);
}
