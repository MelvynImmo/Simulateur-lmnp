import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieOptions = Parameters<CookieStore["set"]>[2];
type CookieToSet = { name: string; value: string; options?: CookieOptions };

type CookieHandlers = {
  getAll: () => ReturnType<CookieStore["getAll"]>;
  setAll: (cookiesToSet: CookieToSet[]) => void;
};

const createClient = (cookieStore: CookieStore, handlers: CookieHandlers) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { cookies: handlers }
  );

export async function createSupabaseServerComponentClient() {
  const cookieStore = await cookies();

  return createClient(cookieStore, {
    getAll() {
      return cookieStore.getAll();
    },
    setAll() {
      // Server Components cannot set cookies.
    },
  });
}

export async function createSupabaseServerActionClient() {
  const cookieStore = await cookies();

  return createClient(cookieStore, {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch {
          // Server Action cookie writes can fail in edge cases; ignore to match Supabase SSR guidance.
        }
      });
    },
  });
}
