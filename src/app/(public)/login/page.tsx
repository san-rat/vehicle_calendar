import { redirect } from "next/navigation";
import {
  getCurrentAppUserState,
  getLoginErrorMessage,
  getPostLoginPath,
} from "@/lib/auth/user";
import { LoginForm } from "@/components/LoginForm";
import { RouteTransition } from "@/components/RouteTransition";
import { Badge, Notice, Panel } from "@/components/ui";
import { CalendarIcon, LogIcon, ManageIcon } from "@/components/ui/icons";
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
    <div className="relative flex min-h-screen items-start overflow-hidden py-6 sm:py-10 md:items-center md:py-14">
      <div
        className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[var(--brand-500)]/12 blur-3xl animate-blob-1"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-[var(--info)]/10 blur-3xl animate-blob-2"
      />
      <div className="app-container">
        <RouteTransition
          className="mx-auto max-w-[1180px]"
          transitionKey="login"
        >
          <div className="grid gap-5 md:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,460px)] lg:items-stretch">
            <Panel
              className="order-2 relative overflow-hidden border-white/65 p-6 sm:p-8 md:order-1 md:p-10 lg:p-12"
              variant="elevated"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,122,108,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(42,111,170,0.08),transparent_28%)]" />
              <div className="relative flex h-full flex-col justify-between gap-5 md:gap-8">
                <div className="space-y-3 md:space-y-4">
                  <Badge tone="primary">FleetTime</Badge>
                  <div className="space-y-2">
                    <p className="text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[3rem] md:text-[3.5rem]">
                      <span className="text-[var(--brand-500)]">Fleet</span>Time
                    </p>
                    <h1 className="max-w-2xl text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-[2.4rem] md:text-[3.2rem]">
                      Scheduling and approvals for shared vehicles.
                    </h1>
                  </div>
                </div>

                <div className="grid gap-2.5 md:gap-4 md:grid-cols-3">
                  <div className="flex h-full items-center gap-3 rounded-[18px] border border-white/80 bg-white/84 p-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:rounded-[22px] md:p-4 md:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[var(--brand-100)] text-[var(--brand-600)] md:h-10 md:w-10 md:rounded-2xl">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] md:text-sm">
                      Clear schedule
                    </p>
                  </div>
                  <div className="flex h-full items-center gap-3 rounded-[18px] border border-white/80 bg-white/84 p-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:rounded-[22px] md:p-4 md:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[var(--info-soft)] text-[var(--info)] md:h-10 md:w-10 md:rounded-2xl">
                      <ManageIcon className="h-5 w-5" />
                    </span>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] md:text-sm">
                      Faster approvals
                    </p>
                  </div>
                  <div className="flex h-full items-center gap-3 rounded-[18px] border border-white/80 bg-white/84 p-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:rounded-[22px] md:p-4 md:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[var(--success-soft)] text-[var(--success)] md:h-10 md:w-10 md:rounded-2xl">
                      <LogIcon className="h-5 w-5" />
                    </span>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] md:text-sm">
                      Clear activity
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              className="order-1 overflow-hidden border-white/72 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.1)] md:order-2 md:p-10 md:shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
              variant="elevated"
            >
              <div className="mb-6 space-y-2.5 md:mb-8 md:space-y-3">
                <Badge className="w-fit" tone="neutral">
                  Secure sign in
                </Badge>
                <div>
                  <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    Sign in
                  </h2>
                </div>
              </div>

              {errorMessage ? (
                <Notice className="mb-6" tone="danger">
                  {errorMessage}
                </Notice>
              ) : null}

              <LoginForm formAction={logInWithName} />
            </Panel>
          </div>
        </RouteTransition>
      </div>
    </div>
  );
}
