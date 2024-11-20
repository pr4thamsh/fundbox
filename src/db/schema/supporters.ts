import {
  pgTable as table,
  integer,
  varchar,
  serial,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const supporters = table("supporters", {
  id: serial().primaryKey(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  email: varchar().notNull(),
  phone: integer().notNull(),
  street: varchar().notNull(),
  postalCode: varchar("postal_code").notNull(),
  ...timestamps,
});

export type Supporter = InferSelectModel<typeof supporters>;
export type NewSupporter = InferInsertModel<typeof supporters>;
