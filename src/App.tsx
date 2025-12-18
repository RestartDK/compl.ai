import { useState, useEffect } from "react";
import { PartyPopper, ShieldCheck, Upload, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { QuestionCard } from "./components/QuestionCard";
import { RoleCard } from "./components/RoleCard";
import { seedDefaultData, getInitialCompanyAndPosition, setStoredData, getStoredData, resetToDefault, type DemoData } from "./lib/data-storage";

export default function App() {
  const [position, setPosition] = useState("Financial Advisor");
  const [company, setCompany] = useState("Goldman Sacks");
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [dataStats, setDataStats] = useState<{ employees: number; restrictions: number }>({ employees: 0, restrictions: 0 });

  // Seed localStorage on first load and initialize company/position
  useEffect(() => {
    seedDefaultData();
    const { company: initialCompany, position: initialPosition } = getInitialCompanyAndPosition();
    setCompany(initialCompany);
    setPosition(initialPosition);
    updateDataStats();
  }, []);

  const updateDataStats = () => {
    const data = getStoredData();
    setDataStats({
      employees: data?.demo_employees?.length || 0,
      restrictions: data?.firm_restricted_list?.length || 0,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setUploadStatus({ type: 'error', message: 'Please upload a JSON file.' });
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DemoData;
      
      // Validate structure
      if (!parsed.demo_employees || !Array.isArray(parsed.demo_employees)) {
        throw new Error('Invalid JSON structure: demo_employees array is required');
      }
      if (!parsed.firm_restricted_list || !Array.isArray(parsed.firm_restricted_list)) {
        throw new Error('Invalid JSON structure: firm_restricted_list array is required');
      }

      setStoredData(parsed);
      updateDataStats();
      setUploadStatus({ type: 'success', message: `Successfully loaded ${parsed.demo_employees.length} employees and ${parsed.firm_restricted_list.length} restrictions.` });
      
      // Update company/position to first employee if available
      const firstEmployee = parsed.demo_employees[0];
      if (firstEmployee?.firm) setCompany(firstEmployee.firm);
      if (firstEmployee?.role) setPosition(firstEmployee.role);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to parse JSON file.',
      });
    }

    // Reset input
    event.target.value = '';
  };

  const handleReset = () => {
    resetToDefault();
    updateDataStats();
    const { company: initialCompany, position: initialPosition } = getInitialCompanyAndPosition();
    setCompany(initialCompany);
    setPosition(initialPosition);
    setUploadStatus({ type: 'success', message: 'Reset to default demo data.' });
  };

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

        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              <Upload className="h-4 w-4 text-emerald-500" />
              Data Management
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {dataStats.employees} employees • {dataStats.restrictions} restrictions
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <Upload className="h-4 w-4" />
              Upload JSON
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Demo
            </button>
          </div>

          {uploadStatus.type && (
            <div className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              uploadStatus.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          )}
        </section>

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
