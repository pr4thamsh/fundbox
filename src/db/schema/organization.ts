import { pgTable as table, varchar, serial } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";

export const organizations = table("organizations", {
  id: serial().primaryKey(),
  name: varchar({ length: 256 }),
  street: varchar(),
  postalCode: varchar("postal_code"),
  ...timestamps,
});
