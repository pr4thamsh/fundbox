import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { orders } from "@/db/schema/orders";
import { fundraisers } from "@/db/schema/fundraisers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const { payment_intent, fundraiser_id } = req.query;

  if (!payment_intent || !fundraiser_id) {
    return res.status(400).json({
      error: "Missing required parameters: payment_intent or fundraiser_id",
    });
  }

  try {
    // Get order details with fundraiser information
    const [orderDetails] = await db
      .select({
        // Fundraiser details
        fundraiser: {
          id: fundraisers.id,
          title: fundraisers.title,
        },
        // Payment details
        payment: {
          id: orders.stripePaymentIntentId,
          amount: orders.amount,
          created: orders.created_at,
        },
        // Ticket details
        tickets: {
          quantity: sql`array_length(${orders.ticketNumbers}, 1)`,
          ticketNumbers: orders.ticketNumbers,
        },
      })
      .from(orders)
      .innerJoin(
        fundraisers,
        and(
          eq(orders.fundraiserId, fundraisers.id),
          eq(fundraisers.id, parseInt(fundraiser_id as string)),
        ),
      )
      .where(eq(orders.stripePaymentIntentId, payment_intent as string));

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Format ticket numbers to strings as expected by the frontend
    const formattedOrderDetails = {
      ...orderDetails,
      tickets: {
        ...orderDetails.tickets,
        ticketNumbers: orderDetails.tickets.ticketNumbers.map(String),
      },
    };

    return res.status(200).json(formattedOrderDetails);
  } catch (error) {
    console.error("Failed to fetch payment details:", error);
    return res.status(500).json({ error: "Failed to fetch payment details" });
  }
}
