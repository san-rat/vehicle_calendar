import { redirect } from "next/navigation";
import { getCurrentAppUserState, getPostLoginPath } from "@/lib/auth/user";

export default async function Home() {
  const { user, problem } = await getCurrentAppUserState();

  if (problem) {
    redirect(`/auth/logout?reason=${problem}`);
  }

  if (user) {
    redirect(getPostLoginPath(user.role));
  }

  redirect("/login");
}
