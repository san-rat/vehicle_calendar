import Link from "next/link";

export function FloatingLogButton() {
  return (
    <Link
      href="/log"
      className="fixed bottom-6 right-6 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg"
    >
      Log
    </Link>
  );
}
