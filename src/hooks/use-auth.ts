"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(session.user);
      } catch (error) {
        console.error("Error in getUser:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router, supabase.auth]);

  return { user, loading };
}
