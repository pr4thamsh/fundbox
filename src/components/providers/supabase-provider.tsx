"use client";

import { Admin } from "@/db/schema/admins";
import { adminAtom, isLoadingAtom } from "@/store/admin";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const SupabaseContext = createContext({});

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const [, setAdmin] = useAtom(adminAtom);
  const [, setIsLoading] = useAtom(isLoadingAtom);

  const getAdmin = async (email: string) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to login");
      }

      const adminData = await response.json();
      return adminData as Admin;
    } catch (apiError) {
      console.error("❌ API Error:", apiError);
      throw apiError;
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      router.refresh();

      setIsLoading(true);
      try {
        if (session?.user?.email) {
          const adminData = await getAdmin(session.user.email);
          console.log("✅ Admin Data:", adminData);
          setAdmin(adminData);
        } else {
          setAdmin(null);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, setAdmin, setIsLoading]);

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
