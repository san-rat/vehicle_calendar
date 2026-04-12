import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { Button, Field, Notice, Panel, inputClassName } from "@/components/ui";
import { FleetIcon } from "@/components/ui/icons";
import { logInWithName } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user, problem } = await getCurrentAppUserState();

  if (problem) {
    redirect(`/auth/logout?reason=${problem}`);
  }

  if (user) {
    redirect(getPostLoginPath(user.role));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorMessage = getLoginErrorMessage(resolvedSearchParams.error);

  return (
    <div className="flex min-h-screen items-center bg-[var(--bg)] py-12">
      <div className="app-container">
        <Panel className="mx-auto max-w-md p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <FleetIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--primary)]">
                FleetTime
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Use your name and password to open the vehicle calendar.
              </p>
            </div>
          </div>

          {errorMessage ? (
            <Notice className="mt-6" tone="danger">
              {errorMessage}
            </Notice>
          ) : null}

          <form action={logInWithName} className="mt-6 space-y-5">
            <Field htmlFor="name" label="Name">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="username"
                className={inputClassName()}
                placeholder="Super Admin"
                required
              />
            </Field>

            <Field htmlFor="password" label="Password">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClassName()}
                placeholder="Enter your password"
                required
              />
            </Field>

            <Button
              className="w-full"
              tone="primary"
              type="submit"
            >
              Sign in
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
