import {
  pgTable as table,
  integer,
  varchar,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const draws = table("draws", {
  id: serial("id").primaryKey(),
  drawDate: date("draw_date"),
  prize: varchar("prize"),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id, {
    onDelete: "cascade",
  }),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});

export type Draw = InferSelectModel<typeof draws>;
export type NewDraw = InferInsertModel<typeof draws>;
