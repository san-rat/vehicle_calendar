"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, inputClassName } from "@/components/ui";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" loading={pending} size="lg" tone="primary" type="submit">
      {pending ? "Signing in" : "Sign in to FleetTime"}
    </Button>
  );
}

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
            className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-tint)] hover:text-[var(--text-primary)]"
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

      <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface-tint)] px-4 py-3.5">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Scheduling, requests, and admin tools.
        </p>
      </div>

      <LoginSubmitButton />
    </form>
  );
}
