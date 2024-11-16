import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type RequestData = {
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
};

type ResponseData = {
  message: string;
  adminId?: string;
  error?: string;
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

    // Input validation
    if (
      !body.email ||
      !body.password ||
      !body.orgId ||
      !body.firstName ||
      !body.lastName ||
      !body.phoneNumber
    ) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Missing required fields",
      });
    }

    // Check if email already exists
    const existingAdmin = await db.execute(sql`
      SELECT email FROM admin WHERE email = ${body.email}
    `);

    if (existingAdmin.count > 0) {
      return res.status(409).json({
        message: "Registration failed",
        error: "Email already registered",
      });
    }

    // Check if organization exists
    const organization = await db.execute(sql`
      SELECT orgid FROM organization WHERE orgid = ${body.orgId}
    `);

    if (organization.count === 0) {
      return res.status(404).json({
        message: "Registration failed",
        error: "Organization not found",
      });
    }

    // Insert new admin
    const result = await db.execute(sql`
      INSERT INTO admin (orgid, fname, lname, email, password, phoneno)
      VALUES (
        ${body.orgId},
        ${body.firstName},
        ${body.lastName},
        ${body.email},
        ${body.password},
        ${body.phoneNumber}
      )
      RETURNING id
    `);

    const adminId = result;

    return res.status(201).json({
      message: "Admin registered successfully",
      adminId: adminId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Registration failed",
      error: "Internal server error",
    });
  }
}
