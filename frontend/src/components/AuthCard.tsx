import type { FormEvent, ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthCard({ title, subtitle, children, onSubmit }: Props) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-sky/30 bg-panel/90 p-8 shadow-glow backdrop-blur">
      <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {children}
      </form>
    </div>
  );
}
