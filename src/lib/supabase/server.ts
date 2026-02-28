import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type CookieHandlers = {
  getAll: () => ReturnType<CookieStore["getAll"]>;
  setAll: (cookiesToSet: Array<Parameters<CookieStore["set"]>[0]>) => void;
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
      cookiesToSet.forEach((cookie) => {
        cookieStore.set(cookie);
      });
    },
  });
}
