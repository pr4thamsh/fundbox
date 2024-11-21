import { NextApiRequest, NextApiResponse } from "next";
import { processEmails } from "@/lib/emails";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const results = await processEmails();
    res.status(results.success ? 200 : 500).json(results);
  } catch (error) {
    console.error("Error in manual email processing:", error);
    res.status(500).json({ error: "Failed to process emails" });
  }
}
