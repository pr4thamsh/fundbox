"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { adminAtom } from "@/store/admin";

const SupabaseContext = createContext({});

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const [, setAdmin] = useAtom(adminAtom);

  const getAdmin = async (email: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin data");
      }

      const { admin } = await response.json();
      return admin;
    } catch (error) {
      console.error("❌ Failed to fetch admin:", error);
      return null;
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setAdmin(null);
        return;
      }

      if (session?.user?.email) {
        try {
          const adminData = await getAdmin(session.user.email);
          setAdmin(adminData);
        } catch (error) {
          console.error("💥 Auth state change error:", error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }

      router.refresh();
    });

    const initializeAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        try {
          const adminData = await getAdmin(session.user.email);
          setAdmin(adminData);
        } catch (error) {
          console.error("🚨 Failed to initialize admin:", error);
          setAdmin(null);
        }
      }
    };

    initializeAdmin();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, setAdmin]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
