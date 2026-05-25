import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#24364a_0%,#131922_45%,#0b0f15_100%)] px-4 py-4 font-body text-white lg:px-6">
      <div className="mx-auto max-w-7xl animate-[fadeIn_0.6s_ease]">{children}</div>
    </div>
  );
}
