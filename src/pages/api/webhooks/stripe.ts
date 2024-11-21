import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "stream/consumers";
import Stripe from "stripe";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { fundraisers } from "@/db/schema/fundraisers";
import { orders } from "@/db/schema/orders";
import { supporters } from "@/db/schema/supporters";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        webhookSecret,
      );
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.log(`❌ Error message: ${error}`);
      res.status(400).send(`Webhook Error: ${error}`);
      return;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        try {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const metadata = paymentIntent.metadata;

          await db.transaction(async (tx) => {
            // Create supporter
            const [newSupporter] = await tx
              .insert(supporters)
              .values({
                firstName: metadata.firstName,
                lastName: metadata.lastName,
                email: metadata.email,
                phone: metadata.phone,
                street: metadata.addressLine1,
                postalCode: metadata.postalCode,
              })
              .returning();

            // Update fundraiser and get current ticketsSold atomically
            const [updatedFundraiser] = await tx
              .update(fundraisers)
              .set({
                ticketsSold: sql`${fundraisers.ticketsSold} + ${parseInt(
                  metadata.ticketsPurchased,
                )}`,
                fundRaised: sql`${fundraisers.fundRaised} + ${paymentIntent.amount}`,
              })
              .where(eq(fundraisers.id, parseInt(metadata.fundraiserId)))
              .returning({ currentTicketsSold: fundraisers.ticketsSold });

            // Calculate ticket numbers based on updated ticketsSold
            const ticketStart =
              updatedFundraiser.currentTicketsSold! -
              parseInt(metadata.ticketsPurchased) +
              1;
            const ticketNumbers = Array.from(
              { length: parseInt(metadata.ticketsPurchased) },
              (_, i) => ticketStart + i,
            );

            // Create order
            await tx.insert(orders).values({
              ticketNumbers,
              amount: paymentIntent.amount,
              stripePaymentIntentId: paymentIntent.id,
              stripePaymentStatus: paymentIntent.status,
              fundraiserId: parseInt(metadata.fundraiserId),
              supporterId: newSupporter.id,
            });
          });

          console.log(`💰 PaymentIntent successful: ${paymentIntent.id}`);
        } catch (error) {
          console.error("Database operation failed:", error);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
