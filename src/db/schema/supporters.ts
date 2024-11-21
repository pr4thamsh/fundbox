import { pgTable, varchar, serial, index } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const supporters = pgTable(
  "supporters",
  {
    id: serial().primaryKey(),
    firstName: varchar("first_name", { length: 256 }).notNull(),
    lastName: varchar("last_name", { length: 256 }).notNull(),
    email: varchar().notNull(),
    phone: varchar().notNull(),
    street: varchar().notNull(),
    postalCode: varchar("postal_code").notNull(),
    ...timestamps,
  },
  (table) => ({
    firstNameIdx: index("supporters_first_name_idx").on(table.firstName),
    lastNameIdx: index("supporters_last_name_idx").on(table.lastName),
    emailIdx: index("supporters_email_idx").on(table.email),
    fullNameIdx: index("supporters_full_name_idx").on(
      table.firstName,
      table.lastName,
    ),
  }),
);

export type Supporter = InferSelectModel<typeof supporters>;
export type NewSupporter = InferInsertModel<typeof supporters>;
