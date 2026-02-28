"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { duplicateSimulation } from "@/app/simulations/[id]/actions";

export async function deleteSimulation(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Identifiant manquant.");
  }

  const supabase = await createSupabaseServerActionClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/auth");
  }

  const { error } = await supabase.from("simulations").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/simulations");
  redirect("/simulations");
}

export async function duplicateSimulationFromList(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Identifiant manquant.");
  }

  await duplicateSimulation(id);
}
