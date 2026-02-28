import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerActionClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
