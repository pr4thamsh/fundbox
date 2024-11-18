import { pgTable as table, integer, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { InferSelectModel } from "drizzle-orm";

export const supporters = table("supporters", {
  id: integer().primaryKey(),
  firstName: varchar("first_name", { length: 256 }),
  lastName: varchar("last_name", { length: 256 }),
  email: varchar().notNull(),
  phone: integer().notNull(),
  street: varchar().notNull(),
  postalCode: varchar("postal_code").notNull(),
  ...timestamps,
});

export type Supporter = InferSelectModel<typeof supporters>;
