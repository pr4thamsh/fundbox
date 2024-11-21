export async function startEmailListener() {
  try {
    const response = await fetch("http://localhost:3000/api/send");
    if (!response.ok) {
      throw new Error("Failed to start email listener");
    }
    console.log("📧 Email listener started successfully");
  } catch (error) {
    console.error("❌ Failed to start email listener:", error);
  }
}
