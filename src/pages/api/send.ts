import { OrderConfirmationEmail } from "@/components/email-template";
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { Client } from "pg";

const resend = new Resend(process.env.RESEND_API_KEY);

let client: Client | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    if (client) {
      return res
        .status(200)
        .json({ message: "Email listener already running" });
    }

    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    console.log("📡 Connected to database");

    await client.query("LISTEN email_events");
    console.log("👂 Listening for email events");

    client.on("notification", async (msg) => {
      try {
        const payload = JSON.parse(msg.payload!);

        const emailResponse = await resend.emails.send({
          from: "Fundbox <team@fundbox.live>",
          to: payload.supporter_email,
          subject: `Your Fundbox Order Confirmation - #${payload.order_id}`,
          react: OrderConfirmationEmail({
            supporterName: payload.supporter_name,
            fundraiserTitle: payload.fundraiser_title,
            ticketNumbers: payload.ticket_numbers,
            amount: payload.amount,
            pricePerTicket: payload.price_per_ticket,
            orderId: payload.order_id,
          }),
        });

        if (emailResponse.error) {
          console.error("🚫 Failed to send email:", emailResponse.error);
        } else {
          console.log(
            `✉️ Email sent successfully to ${payload.supporter_email}`,
          );
        }
      } catch (error) {
        console.error("🚫 Error processing notification:", error);
      }
    });

    client.on("error", (err) => {
      console.error("🚫 Database connection error:", err);
      cleanup();
    });

    client.on("end", () => {
      console.log("📡 Database connection ended");
      cleanup();
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write("data: Email listener started\n\n");

    res.on("close", () => {
      cleanup();
    });
  } catch (error) {
    console.error("🚫 Failed to start email listener:", error);
    res.status(500).json({ error: "Failed to start email listener" });
  }
}

function cleanup() {
  if (client) {
    client.end();
    client = null;
    console.log("🧹 Cleaned up database connection");
  }
}
