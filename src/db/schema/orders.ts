import {
  pgTable as table,
  integer,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const orders = table("orders", {
  id: serial().primaryKey(),
  ticketNumbers: integer("ticket_numbers").array().notNull(),
  amount: integer().notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 })
    .notNull()
    .unique(),
  stripePaymentStatus: varchar("stripe_payment_status", {
    length: 50,
  }).notNull(),
  fundraiserId: integer("fundraiser_id")
    .references(() => fundraisers.id)
    .notNull(),
  supporterId: integer("supporter_id")
    .references(() => supporters.id)
    .notNull(),
  ...timestamps,
});

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
