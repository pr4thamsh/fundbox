import { pgTable as table, integer } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";

export const orders = table("orders", {
  id: integer().primaryKey(),
  ticketNumbers: integer(),
  amount: integer(),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});
