import {
  pgTable as table,
  integer,
  varchar,
  text,
  serial,
  date,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { admins } from "./admins";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const fundraisers = table("fundraisers", {
  id: serial().primaryKey(),
  title: varchar(),
  description: varchar(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  ticketsSold: integer(),
  fundRaised: integer(),
  // organizationId: integer("organization_id").references(() => organizations.id),
  organizationId: integer("organization_id"),
  adminId: text("admin_id").references(() => admins.id),
  ...timestamps,
});

export type Fundraiser = InferSelectModel<typeof fundraisers>;
export type NewFundraiser = InferInsertModel<typeof fundraisers>;
