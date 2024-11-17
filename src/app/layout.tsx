import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

export const metadata: Metadata = {
  title: "FundBox - Fundraiser Manager",
  description: "A platform for managing fundraisers with lucky draw system",
  keywords: ["fundraiser", "charity", "lucky draw", "donations"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <main className="relative flex min-h-screen flex-col">
              {children}
            </main>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
