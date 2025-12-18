import { useEffect, useMemo, useState } from "react";
import { Mail, Sparkles, Loader2 } from "lucide-react";
import { findEmployeeByFirmAndRole, getFirmRestrictions } from "../lib/data-storage";

type Props = {
  position: string;
  company: string;
};

type Decision = "yes" | "no" | "ask";

export function QuestionCard({ position, company }: Props) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailTemplate = useMemo(
    () => `Hi Compliance Team,

I'd like to make the following trade: ${query}

Role: ${position}
Company: ${company}

Based on our internal policy, I need clarification before proceeding.

Thanks!`,
    [company, position, query]
  );

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCheck = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setDecision(null);
    setReason("");

    try {
      const employee = findEmployeeByFirmAndRole(company, position);
      
      if (!employee) {
        setDecision("ask");
        setReason(`No employee found matching "${position}" at "${company}". Please check your role and company selection.`);
        setIsLoading(false);
        return;
      }

      const { firm_restricted_list, quick_reference } = getFirmRestrictions();

      const res = await fetch("/api/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm_name: company,
          employee: employee,
          firm_restricted_list: firm_restricted_list,
          quick_reference: quick_reference,
          query: query,
        }),
      });

      const data = await res.json();

      if (data.status === "SUCCESS" && data.compliance) {
        const isAllowed = data.compliance.allowed;
        setDecision(isAllowed ? "yes" : "no");

        // Format the reason from backend
        const backendReasons = data.compliance.reasons || [];
        const formattedReason =
          backendReasons.length > 0
            ? backendReasons.join(" ")
            : isAllowed
              ? "No conflicts detected with firm policy."
              : "This trade is restricted by firm policy.";

        setReason(formattedReason);
      } else {
        // Handle error or unsure response
        console.error("Backend error:", data);
        setDecision("ask");
        setReason(
          data.message ||
            "We couldn't determine a clear answer. Please consult compliance."
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      setDecision("ask");
      setReason("Unable to reach the compliance server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Ask a compliance question
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          placeholder="Can I buy APPLE stock?"
          disabled={isLoading}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-emerald-400 focus:shadow-md disabled:opacity-50"
        />
        <button
          onClick={handleCheck}
          disabled={isLoading || !query.trim()}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-500 bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
          Privacy-safe
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
          Real-time Check
        </span>
      </div>

      {decision && (
        <ResponsePreview
          decision={decision}
          company={company}
          reason={reason}
          emailTemplate={emailTemplate}
          copied={copied}
          onCopy={setCopied}
        />
      )}
    </section>
  );
}

type ResponsePreviewProps = {
  decision: Decision;
  company: string;
  reason: string;
  emailTemplate: string;
  copied: boolean;
  onCopy: (copied: boolean) => void;
};

function ResponsePreview({
  decision,
  reason,
  emailTemplate,
  copied,
  onCopy,
}: ResponsePreviewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-inner duration-300 md:px-5">
      {decision === "yes" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-emerald-700">
            ✅ Yes — you can proceed.
          </p>
          <p className="text-sm text-slate-600">{reason}</p>
        </div>
      )}

      {decision === "no" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-700">
            🚫 No — purchase is blocked.
          </p>
          <p className="text-sm text-slate-600">{reason}</p>
        </div>
      )}

      {decision === "ask" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-700">🤔 {reason}</p>
          <textarea
            readOnly
            value={emailTemplate}
            className="h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:shadow-md"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Copy and paste into your preferred email client.
            </p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(emailTemplate);
                  onCopy(true);
                } catch {
                  onCopy(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0"
            >
              <Mail className="h-4 w-4" />
              {copied ? "Copied!" : "Copy email text"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

