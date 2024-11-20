"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}