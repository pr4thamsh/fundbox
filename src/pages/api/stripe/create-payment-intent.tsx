import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { fundraisers } from "@/db/schema/fundraisers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type RequestData = {
  fundraiserId: number;
  amount: number;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

type ResponseData = {
  message: string;
  clientSecret?: string | null;
  error?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = req.body as RequestData;

    if (!body.fundraiserId || !body.amount || !body.billingDetails) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    const [fundraiser] = await db
      .select()
      .from(fundraisers)
      .where(eq(fundraisers.id, body.fundraiserId));

    if (!fundraiser) {
      return res.status(404).json({
        message: "Payment failed",
        error: "Fundraiser not found",
      });
    }

    const currentDate = new Date();
    if (new Date(fundraiser.endDate!) < currentDate) {
      return res.status(400).json({
        message: "Payment failed",
        error: "Fundraiser has ended",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount * 100,
      currency: "cad",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        fundraiserId: body.fundraiserId,
        firstName: body.billingDetails.firstName,
        lastName: body.billingDetails.lastName,
        email: body.billingDetails.email,
        phone: body.billingDetails.phone,
        addressLine1: body.billingDetails.addressLine1,
        addressLine2: body.billingDetails.addressLine2 || "",
        city: body.billingDetails.city,
        state: body.billingDetails.state,
        postalCode: body.billingDetails.postalCode,
        country: body.billingDetails.country,
      },
    });

    return res.status(200).json({
      message: "Payment intent created successfully",
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return res.status(500).json({
      message: "Payment intent creation failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
