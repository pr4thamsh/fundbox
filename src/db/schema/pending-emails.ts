import { pgTable, serial, varchar, jsonb } from "drizzle-orm/pg-core";
import { timestamps } from "../columns.helper";

type EmailData = {
  type: string;
  supporter_email: string;
  supporter_name: string;
  fundraiser_title: string;
  ticket_numbers: number[];
  amount: number;
  price_per_ticket: number;
  order_id: number;
};

export const pendingEmails = pgTable("pending_emails", {
  id: serial("id").primaryKey(),
  emailData: jsonb("email_data").$type<EmailData>().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  ...timestamps,
});
