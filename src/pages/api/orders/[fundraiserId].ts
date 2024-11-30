import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { supporters } from "@/db/schema/supporters";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_PAGE_SIZE = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      fundraiserId,
      search,
      page = "1",
      pageSize = DEFAULT_PAGE_SIZE,
    } = req.query;
    const currentPage = parseInt(page as string);
    const limit = parseInt(pageSize as string);
    const offset = (currentPage - 1) * limit;

    const whereCondition = search
      ? and(
          eq(orders.fundraiserId, Number(fundraiserId)),
          or(
            ilike(supporters.firstName, `${search}%`),
            ilike(supporters.lastName, `${search}%`),
            ilike(supporters.email, `${search}%`),
          ),
        )
      : eq(orders.fundraiserId, Number(fundraiserId));

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .innerJoin(supporters, eq(orders.supporterId, supporters.id))
      .where(whereCondition);

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
      .innerJoin(supporters, eq(orders.supporterId, supporters.id))
      .where(whereCondition)
      .orderBy(desc(orders.created_at))
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      orders: results,
      total: countResult.count,
      page: currentPage,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
