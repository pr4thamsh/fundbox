"use client";

import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.user_metadata.first_name}!</h1>
      <p>Your email: {user?.email}</p>
    </div>
  );
}
