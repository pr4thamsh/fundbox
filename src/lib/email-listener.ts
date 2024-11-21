export async function startEmailListener() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send`);
    if (!response.ok) {
      throw new Error("Failed to start email listener");
    }
    console.log("📧 Email listener started successfully");
  } catch (error) {
    console.error("❌ Failed to start email listener:", error);
  }
}
