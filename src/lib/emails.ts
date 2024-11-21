import { db } from "@/db";
import { pendingEmails } from "@/db/schema/pending-emails";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function processEmails() {
  const results = {
    success: 0,
    failed: 0,
    total: 0,
  };

  try {
    const pendingEmailsToSend = await db
      .select()
      .from(pendingEmails)
      .where(eq(pendingEmails.status, "pending"))
      .limit(10);

    results.total = pendingEmailsToSend.length;

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
            orderId: String(emailData.order_id),
          }),
        });

        await db
          .update(pendingEmails)
          .set({
            status: emailResponse.error ? "failed" : "sent",
            updated_at: new Date(),
          })
          .where(eq(pendingEmails.id, emailRecord.id));

        if (emailResponse.error) {
          results.failed++;
        } else {
          results.success++;
        }
      } catch (error) {
        console.error(`Failed to send email ${emailRecord.id}:`, error);

        await db
          .update(pendingEmails)
          .set({
            status: "failed",
            updated_at: new Date(),
          })
          .where(eq(pendingEmails.id, emailRecord.id));

        results.failed++;
      }
    }

    return {
      ...results,
    };
  } catch (error) {
    console.error("Error processing emails:", error);
    return {
      error: "Failed to process emails",
      ...results,
    };
  }
}
