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
  title: varchar(),
  description: varchar(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  ticketsSold: integer(),
  fundRaised: integer(),
  organizationId: integer("organization_id").references(() => organizations.id),
  adminId: text("admin_id").references(() => admins.id),
  ...timestamps,
});

export const activeFundraisersView = pgView("active_fundraisers_view", {
  id: serial().primaryKey(),
  title: varchar(),
  description: varchar(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  ticketsSold: integer(),
  fundRaised: integer(),
  organizationId: integer("organization_id"),
  adminId: text("admin_id"),
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

export type Fundraiser = InferSelectModel<typeof fundraisers>;
export type NewFundraiser = InferInsertModel<typeof fundraisers>;
