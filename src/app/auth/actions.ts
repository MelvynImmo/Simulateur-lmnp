"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const getRedirectTarget = (formData: FormData) =>
  (formData.get("redirect") as string | null) ?? "/dashboard";

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerActionClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(getRedirectTarget(formData));
}

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseServerActionClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(getRedirectTarget(formData));
}

export async function signOut() {
  const supabase = await createSupabaseServerActionClient();
  await supabase.auth.signOut();
  redirect("/");
}
