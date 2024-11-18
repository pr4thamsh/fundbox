import { date, integer, pgTable as table, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { fundraisers } from "./fundraisers";
import { supporters } from "./supporters";
import { InferInsertModel, InferSelectModel } from "drizzle-orm/table";

export const draws = table("draws", {
  id: integer().primaryKey(),
  drawDate: date("draw_date"),
  prize: varchar(),
  fundraiserId: integer("fundraiser_id").references(() => fundraisers.id),
  supporterId: integer("supporter_id").references(() => supporters.id),
  ...timestamps,
});

export type Draw = InferSelectModel<typeof supporters>;
export type NewDraw = InferInsertModel<typeof supporters>;
