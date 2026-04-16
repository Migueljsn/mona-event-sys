"use client";

import { useActionState } from "react";

import { signInAction, type LoginActionState } from "@/app/admin/login/actions";

const initialState: LoginActionState = {
  success: false,
};

type LoginFormProps = {
  disabled?: boolean;
};

export function LoginForm({ disabled = false }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 rounded-2xl border border-[var(--color-line)] px-4 outline-none transition focus:border-[var(--color-brand)]"
          placeholder="admin@cliente.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 rounded-2xl border border-[var(--color-line)] px-4 outline-none transition focus:border-[var(--color-brand)]"
          placeholder="Sua senha"
        />
      </div>

      {disabled ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Configure as variáveis do Supabase em `.env.local` para habilitar o
          login real do painel.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || disabled}
        className="mt-2 h-12 rounded-2xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Configurar acesso" : pending ? "Entrando..." : "Entrar no painel"}
      </button>
    </form>
  );
}
