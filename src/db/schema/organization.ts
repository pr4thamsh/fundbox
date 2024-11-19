import { pgTable as table, varchar, serial } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const organizations = table("organizations", {
  id: serial().primaryKey(),
  name: varchar({ length: 256 }),
  street: varchar(),
  postalCode: varchar("postal_code"),
  ...timestamps,
});

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;