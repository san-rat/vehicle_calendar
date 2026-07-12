"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, inputClassName } from "@/components/ui";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

export function LoginForm({
  formAction,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <Field htmlFor="name" label="Name">
        <input
          autoComplete="username"
          className={inputClassName()}
          id="name"
          name="name"
          placeholder="Your account name"
          required
          type="text"
        />
      </Field>

      <Field htmlFor="password" label="Password">
        <div className="relative">
          <input
            autoComplete="current-password"
            className={inputClassName("pr-12")}
            id="password"
            name="password"
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-tint)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-500)]/20"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? (
              <EyeOffIcon className="h-[1.125rem] w-[1.125rem]" />
            ) : (
              <EyeIcon className="h-[1.125rem] w-[1.125rem]" />
            )}
          </button>
        </div>
      </Field>

      <SubmitButton
        className="w-full"
        pendingLabel="Signing in"
        size="lg"
        tone="primary"
      >
        Sign in to FleetTime
      </SubmitButton>
    </form>
  );
}
