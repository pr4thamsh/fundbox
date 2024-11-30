import {
  pgTable as table,
  integer,
  varchar,
  text,
  serial,
  date,
  pgView,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { admins } from "./admins";
import {
  and,
  gte,
  InferInsertModel,
  InferSelectModel,
  lte,
  sql,
} from "drizzle-orm";
import { organizations } from "./organization";

export const fundraisers = table("fundraisers", {
  id: serial().primaryKey(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ticketsSold: integer("tickets_sold").notNull(),
  fundRaised: integer("fund_raised").notNull(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  adminId: text("admin_id")
    .references(() => admins.id)
    .notNull(),
  pricePerTicket: integer("price_per_ticket").notNull(),
  ...timestamps,
});

export const activeFundraisersView = pgView("active_fundraisers_view", {
  id: serial().primaryKey(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ticketsSold: integer("tickets_sold").notNull(),
  fundRaised: integer("fund_raised").notNull(),
  organizationId: integer("organization_id").notNull(),
  adminId: text("admin_id").notNull(),
  pricePerTicket: integer("price_per_ticket").notNull(),
  ...timestamps,
}).as(
  sql`
    SELECT * FROM ${fundraisers} 
    WHERE ${and(
      lte(fundraisers.startDate, sql`CURRENT_DATE`),
      gte(fundraisers.endDate, sql`CURRENT_DATE`),
    )}
  `,
);

export const pastFundraisersView = pgView("past_fundraisers_view", {
  id: serial().primaryKey(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ticketsSold: integer("tickets_sold").notNull(),
  fundRaised: integer("fund_raised").notNull(),
  organizationId: integer("organization_id").notNull(),
  adminId: text("admin_id").notNull(),
  pricePerTicket: integer("price_per_ticket").notNull(),
  ...timestamps,
}).as(
  sql`
    SELECT * FROM ${fundraisers} 
    WHERE ${lte(fundraisers.endDate, sql`CURRENT_DATE`)}
    ORDER BY end_date DESC
  `,
);

export const upcomingFundraisersView = pgView("upcoming_fundraisers_view", {
  id: serial().primaryKey(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ticketsSold: integer("tickets_sold").notNull(),
  fundRaised: integer("fund_raised").notNull(),
  organizationId: integer("organization_id").notNull(),
  adminId: text("admin_id").notNull(),
  pricePerTicket: integer("price_per_ticket").notNull(),
  ...timestamps,
}).as(
  sql`
    SELECT * FROM ${fundraisers} 
    WHERE ${gte(fundraisers.startDate, sql`CURRENT_DATE`)}
    ORDER BY start_date ASC
  `,
);

export type Fundraiser = InferSelectModel<typeof fundraisers>;
export type NewFundraiser = InferInsertModel<typeof fundraisers>;
