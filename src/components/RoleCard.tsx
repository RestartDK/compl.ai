import type { Dispatch, SetStateAction } from "react";

type Props = {
  position: string;
  company: string;
  setPosition: Dispatch<SetStateAction<string>>;
  setCompany: Dispatch<SetStateAction<string>>;
};

export function RoleCard({
  position,
  company,
  setPosition,
  setCompany,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur md:p-8">
      <div className="flex flex-wrap items-center gap-4 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
        <span className="text-slate-800">I'm</span>
        <input
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          placeholder="Your role"
          className="h-[52px] min-w-[200px] rounded-2xl border border-slate-200/90 bg-white px-4 text-lg font-semibold text-slate-800 shadow-sm outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:shadow"
        />
        <span className="text-2xl text-slate-800 md:text-3xl">at</span>
        <input
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          placeholder="Your company"
          className="h-[52px] min-w-[200px] rounded-2xl border border-slate-200/90 bg-white px-4 text-lg font-semibold text-slate-800 shadow-sm outline-none transition focus:-translate-y-0.5 focus:border-emerald-400 focus:shadow"
        />
      </div>
      <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
        State-backed inputs with defaults: Financial Advisor at Goldman Sacks.
        Edit to preview other contexts—we'll wire this to your profile soon.
      </p>
    </section>
  );
}

