import { useState } from "react";
import { PartyPopper, ShieldCheck } from "lucide-react";
import { QuestionCard } from "./components/QuestionCard";
import { RoleCard } from "./components/RoleCard";

export default function App() {
  const [position, setPosition] = useState("Financial Advisor");
  const [company, setCompany] = useState("Goldman Sacks");

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 md:py-14">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-800">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            COMPL.AI
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              UI draft
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-amber-100 text-xl shadow-inner">
              <PartyPopper className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-5">
          <RoleCard
            position={position}
            company={company}
            setPosition={setPosition}
            setCompany={setCompany}
          />

          <QuestionCard position={position} company={company} />
        </main>
      </div>
    </div>
  );
}
