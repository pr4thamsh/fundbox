import { pgTable, integer, serial, varchar, index } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const orders = pgTable(
  "orders",
  {
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
  },
  (table) => ({
    fundraiserIdIdx: index("orders_fundraiser_id_idx").on(table.fundraiserId),
    supporterIdIdx: index("orders_supporter_id_idx").on(table.supporterId),
    fundraiserSupporterIdx: index("orders_fundraiser_supporter_idx").on(
      table.fundraiserId,
      table.supporterId,
    ),
  }),
);

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
