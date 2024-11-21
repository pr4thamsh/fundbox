import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { pendingEmails } from "@/db/schema/pending-emails";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const pendingEmailsToSend = await db
      .select()
      .from(pendingEmails)
      .where(eq(pendingEmails.status, "pending"))
      .limit(10);

    for (const emailRecord of pendingEmailsToSend) {
      try {
        const emailData = emailRecord.emailData;

        const emailResponse = await resend.emails.send({
          from: "Fundbox <team@fundbox.live>",
          to: emailData.supporter_email,
          subject: `Your Fundbox Order Confirmation - #${emailData.order_id}`,
          react: OrderConfirmationEmail({
            supporterName: emailData.supporter_name,
            fundraiserTitle: emailData.fundraiser_title,
            ticketNumbers: emailData.ticket_numbers,
            amount: emailData.amount,
            pricePerTicket: emailData.price_per_ticket,
            orderId: emailData.order_id.toString(),
          }),
        });

        await db
          .update(pendingEmails)
          .set({
            status: emailResponse.error ? "failed" : "sent",
            updated_at: new Date(),
          })
          .where(eq(pendingEmails.id, emailRecord.id));
      } catch (error) {
        console.error(`Failed to send email ${emailRecord.id}:`, error);

        await db
          .update(pendingEmails)
          .set({
            status: "failed",
            updated_at: new Date(),
          })
          .where(eq(pendingEmails.id, emailRecord.id));
      }
    }

    res.status(200).json({
      success: true,
      processed: pendingEmailsToSend.length,
    });
  } catch (error) {
    console.error("Error processing emails:", error);
    res.status(500).json({ error: "Failed to process emails" });
  }
}
