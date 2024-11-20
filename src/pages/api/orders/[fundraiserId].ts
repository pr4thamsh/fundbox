import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { supporters } from "@/db/schema/supporters";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { fundraiserId, search } = req.query;
    
    const results = await db
      .select({
        orderId: orders.id,
        amount: orders.amount,
        ticketNumbers: orders.ticketNumbers,
        paymentStatus: orders.stripePaymentStatus,
        createdAt: orders.created_at,
        supporterFirstName: supporters.firstName,
        supporterLastName: supporters.lastName,
        supporterEmail: supporters.email,
        supporterPhone: supporters.phone,
        supporterStreet: supporters.street,
        supporterPostalCode: supporters.postalCode,
      })
      .from(orders)
      .leftJoin(supporters, eq(orders.supporterId, supporters.id))
      .where(
        search
          ? and(
              eq(orders.fundraiserId, Number(fundraiserId)),
              or(
                ilike(supporters.firstName, `%${search}%`),
                ilike(supporters.lastName, `%${search}%`),
                ilike(supporters.email, `%${search}%`)
              )
            )
          : eq(orders.fundraiserId, Number(fundraiserId))
      )
      .orderBy(desc(orders.created_at))
      .limit(100);

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}