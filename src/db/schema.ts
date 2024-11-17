import { pgTable as table, integer, varchar, date } from "drizzle-orm/pg-core";
import { timestamps } from "./columns.helper";

export const admins = table("admins", {
  id: integer().primaryKey(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  email: varchar().notNull().unique(),
  phone: varchar().notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  ...timestamps,
});

export const organizations = table("organizations", {
  id: integer().primaryKey(),
  name: varchar({ length: 256 }),
  street: varchar(),
  postalCode: varchar("postal_code"),
  ...timestamps,
});

export const fundraisers = table("fundraisers", {
  id: integer().primaryKey(),
  title: varchar(),
  description: varchar(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  organizationId: integer("organization_id").references(() => organizations.id),
  adminId: integer("admin_id").references(() => admins.id),
  ...timestamps,
});

export const supporters = table("supporters", {
  id: integer().primaryKey(),
  firstName: varchar("first_name", { length: 256 }),
  lastName: varchar("last_name", { length: 256 }),
  email: varchar(),
  phone: integer(),
  treet: varchar(),
  postalCode: varchar("postal_code"),
  ...timestamps,
});

export const orders = table("orders", {
  id: integer().primaryKey(),
  ticketNumbers: integer(),
  amount: integer(),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});

export const draws = table("draws", {
  id: integer().primaryKey(),
  drawDate: date("draw_date"),
  prize: varchar(),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});

export const addresses = table("addresses", {
  postalCode: varchar("postal_code"),
  state: varchar(),
  city: varchar(),
});
