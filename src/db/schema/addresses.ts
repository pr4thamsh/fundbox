import { pgTable as table, varchar } from "drizzle-orm/pg-core";

export const addresses = table("addresses", {
  postalCode: varchar("postal_code"),
  state: varchar(),
  city: varchar(),
});
