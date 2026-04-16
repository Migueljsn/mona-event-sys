"use server";

import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  success: boolean;
  error?: string;
};

export async function signInAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!hasSupabaseEnv()) {
    return {
      success: false,
      error: "Configure o Supabase antes de habilitar o login do painel.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return {
      success: false,
      error: "Informe e-mail e senha.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      success: false,
      error: "Falha no login. Verifique as credenciais do admin.",
    };
  }

  redirect("/admin");
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/admin/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
