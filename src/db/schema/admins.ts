import { pgTable as table, integer, varchar, text } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { timestamps } from "../columns.helper";
import { organizations } from "./organization";

export const admins = table("admins", {
  id: text("id").primaryKey(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  email: varchar().notNull().unique(),
  phone: varchar().notNull(),
  password: varchar("password").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  ...timestamps,
});

export type Admin = InferSelectModel<typeof admins>;
