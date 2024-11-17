"use client";

import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.user_metadata.first_name}!</h1>
      <p>Your email: {user.email}</p>
    </div>
  );
}
