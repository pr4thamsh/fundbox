import {
  pgTable as table,
  integer,
  varchar,
  date,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.helper";
import { InferSelectModel } from "drizzle-orm";

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

export const organizations = table("organizations", {
  id: serial().primaryKey(),
  name: varchar({ length: 256 }),
  street: varchar(),
  postalCode: varchar("postal_code"),
  ...timestamps,
});

export const fundraisers = table("fundraisers", {
  id: serial().primaryKey(),
  title: varchar(),
  description: varchar(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  // organizationId: integer("organization_id").references(() => organizations.id),
  organizationId: integer("organization_id"),
  adminId: text("admin_id").references(() => admins.id),
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
