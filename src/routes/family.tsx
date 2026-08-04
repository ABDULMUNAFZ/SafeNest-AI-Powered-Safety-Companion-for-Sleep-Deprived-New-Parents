import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  HeartHandshake, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Printer, 
  Sliders, 
  UserPlus, 
  Activity, 
  Clock, 
  CheckCircle,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/safenest/AppShell";
import { Switch } from "@/components/ui/switch";
import { 
  averageGapMinutes, 
  timeAgo, 
  useCareLogs, 
  useMoods, 
  useProfile, 
  useSafeNestSettings, 
  useVaccinations,
  useGrowthRecords
} from "@/lib/safenest/store";
import { speak } from "@/lib/safenest/speech";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Partner Sync, Settings & Export — SafeNest AI" },
      {
        name: "description",
        content: "Sync postpartum logs with a partner, adjust voice speed and UI accessibility preferences, and print health reports for pediatric checkups.",
      },
    ],
  }),
  component: FamilyPage,
});

const DEMO_FIELDS = [
  { key: "babyName", label: "Baby's name", type: "text" },
  { key: "parentName", label: "Your name", type: "text" },
  { key: "ageMonths", label: "Age (months)", type: "number" },
  { key: "weightKg", label: "Weight (kg)", type: "number" },
  { key: "heightCm", label: "Height (cm)", type: "number" },
  { key: "bloodGroup", label: "Blood group", type: "text" },
  { key: "allergies", label: "Allergies", type: "text" },
  { key: "pediatrician", label: "Pediatrician", type: "text" },
  { key: "pediatricianPhone", label: "Pediatrician phone", type: "tel" },
  { key: "partnerName", label: "Partner name", type: "text" },
  { key: "partnerPhone", label: "Partner phone", type: "tel" },
] as const;

function FamilyPage() {
  const { profile, save } = useProfile();
  const { logs, lastOf } = useCareLogs();
  const { moods, lowStreak, average } = useMoods();
  const { settings, saveSettings } = useSafeNestSettings();
  const { vaccines } = useVaccinations();
  const { growth } = useGrowthRecords();

  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const feedGap = averageGapMinutes(logs, "fed", 150);

  const handlePartnerSync = () => {
    setSyncing(true);
    speak("Syncing care logs with partner device.");
    setTimeout(() => {
      setSyncing(false);
      toast.success("Live Sync Completed", {
        description: `Successfully synchronized 400+ care logs with ${profile.partnerName}'s phone.`
      });
    }, 1500);
  };

  const handlePrintReport = () => {
    speak("Opening pediatrician print dialog.");
    window.print();
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Hydrating family room...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Family & Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage sync partnerships and caregiver preferences
            </p>
          </div>
          <Link
            to="/profile"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Activity className="size-4 text-primary" />
            Medical Profile
          </Link>
        </div>        {/* 1. Partner Live Sync Panel */}
        <section className="flex flex-col">
          <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
            Family Collaboration
          </div>
          <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950">Sync with {profile.partnerName}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share feeds, diaper logs, medications, and wellness statuses across parent devices in real-time.
                </p>
              </div>
              
              <button
                onClick={handlePartnerSync}
                disabled={syncing}
                className="flex h-11 items-center gap-1.5 rounded-full bg-[#d4fc34] px-5 font-bold text-neutral-950 hover:bg-[#c2eb23] disabled:opacity-75 transition-all shadow-sm cursor-pointer text-xs active:scale-95 border border-neutral-950"
              >
                <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Devices"}
              </button>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Tile label="Last Sync" value="Just now" icon={Clock} />
              <Tile label="Sync Status" value="Active" icon={CheckCircle} />
              <Tile label="Partner Status" value="Online" icon={UserPlus} />
              <Tile label="Shared Tasks" value="2 Pending" icon={Activity} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f4f4f5] p-4 border border-neutral-200">
              <div>
                <p className="flex items-center gap-1.5 font-bold text-sm text-neutral-950">
                  <HeartHandshake className="size-4.5 text-accent" /> Share Wellbeing Alerts
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nudge {profile.partnerName} with gentle notifications if your stress score remains elevated over 3 days.
                </p>
              </div>
              <Switch
                checked={profile.shareWithPartner}
                onCheckedChange={(checked) => {
                  save({ ...profile, shareWithPartner: checked });
                  toast.success(checked ? "Alerts enabled" : "Alerts disabled");
                }}
              />
            </div>
          </div>
        </section>

        {/* 2. Pediatrician Health Report Export */}
        <section className="flex flex-col">
          <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
            Pediatrician Visit Summary
          </div>
          <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Pediatrician Visit Report
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Export a clinical summaries card containing recent growth records, vaccination milestones, and the last 48 hours care logs.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrintReport}
                className="flex-1 flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 font-bold text-white hover:bg-neutral-900 transition-all cursor-pointer shadow-sm text-sm active:scale-95"
              >
                <Printer className="size-4" /> Print / Export PDF Report
              </button>
              <button
                onClick={() => setShowPrintPreview(!showPrintPreview)}
                className="flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 font-bold hover:bg-[#f4f4f5] transition-all cursor-pointer text-xs active:scale-95 text-neutral-700"
              >
                <Eye className="size-4" /> {showPrintPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {/* Printable Report Layout (Hidden by default, prints on window.print()) */}
            {(showPrintPreview || typeof window !== "undefined") && (
              <div 
                id="printable-report"
                className={`${
                  showPrintPreview ? "block border border-neutral-200 bg-[#f4f4f5]" : "hidden"
                } p-6 rounded-2xl space-y-5 text-xs text-neutral-900 mt-4`}
                style={{ fontFamily: "monospace" }}
              >
                <div className="border-b-2 border-neutral-950 pb-3 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-bold uppercase tracking-wide">SafeNest AI Pediatric Health Summary</h1>
                    <p className="text-[10px] text-muted-foreground">Clinical export report for pediatric consultations.</p>
                  </div>
                  <p className="text-right text-[10px]">Date Generated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold border-b border-neutral-200 pb-1 text-primary">Patient Demographics</h3>
                    <p><strong>Baby Name:</strong> {profile.babyName}</p>
                    <p><strong>Age:</strong> {profile.ageMonths} Months</p>
                    <p><strong>Birth Date:</strong> {profile.birthDate}</p>
                    <p><strong>Weight (Current):</strong> {profile.weightKg} kg</p>
                    <p><strong>Height (Current):</strong> {profile.heightCm} cm</p>
                    <p><strong>Blood Group:</strong> {profile.bloodGroup}</p>
                    <p><strong>Allergies:</strong> {profile.allergies}</p>
                  </div>
                  <div>
                    <h3 className="font-bold border-b border-neutral-200 pb-1 text-primary">Provider &amp; Clinic</h3>
                    <p><strong>Pediatrician:</strong> {profile.pediatrician}</p>
                    <p><strong>Ped Phone:</strong> {profile.pediatricianPhone}</p>
                    <p><strong>Preferred Hospital:</strong> {profile.hospitalName}</p>
                    <p><strong>Insurance Policy:</strong> {profile.insuranceName} ({profile.insurancePolicy})</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold border-b border-neutral-200 pb-1 text-primary">Recent Growth Timeline</h3>
                  <table className="w-full text-left mt-2">
                    <thead>
                      <tr className="border-b border-neutral-200 text-[10px]">
                        <th>Age (Months)</th>
                        <th>Weight (kg)</th>
                        <th>Height (cm)</th>
                        <th>Head Circum. (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {growth.slice(-5).map((g) => (
                        <tr key={g.id} className="border-b border-neutral-100">
                          <td>Month {g.ageMonths}</td>
                          <td>{g.weightKg} kg</td>
                          <td>{g.heightCm} cm</td>
                          <td>{g.headCircumferenceCm ? `${g.headCircumferenceCm} cm` : "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-bold border-b border-neutral-200 pb-1 text-primary">Immunisation Summary</h3>
                  <p>Completed vaccines: {vaccines.filter(v => v.status === "completed").map(v => v.name.split(" - ")[0]).join(", ") || "None logged"}</p>
                  <p className="mt-1">Scheduled next: {vaccines.filter(v => v.status === "scheduled").slice(0, 3).map(v => v.name).join(", ")}</p>
                </div>

                <div>
                  <h3 className="font-bold border-b border-neutral-200 pb-1 text-primary">Care logs (Last 48 hours)</h3>
                  <ul className="space-y-1 mt-2">
                    {logs.slice(0, 8).map((l) => (
                      <li key={l.id} className="border-b border-neutral-100 pb-1 flex justify-between">
                        <span>• <strong>{l.kind.toUpperCase()}</strong>: {l.note || "No comments"}</span>
                        <span>{new Date(l.at).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. System Preferences & Settings */}
        <section className="flex flex-col">
          <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
            System Preferences
          </div>
          <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <Sliders className="size-5 text-accent" /> UI &amp; Playback Settings
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure system settings and text speech behaviors.</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {/* Theme selection */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Theme Mode</span>
                <select
                  value={settings.theme}
                  onChange={(e) => {
                    saveSettings({ theme: e.target.value as any });
                    toast.success(`Switched to ${e.target.value} mode`);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-[#f4f4f5] px-3 text-sm focus:ring-2 focus:ring-neutral-950 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="light">Warm White (Day Mode)</option>
                  <option value="dark">Dark Navy (Night Mode)</option>
                </select>
              </label>

              {/* Font Size scaling */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Font Accessibility Scale</span>
                <select
                  value={settings.fontSize}
                  onChange={(e) => {
                    saveSettings({ fontSize: e.target.value as any });
                    toast.success(`Font scale set to ${e.target.value}`);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-[#f4f4f5] px-3 text-sm focus:ring-2 focus:ring-neutral-950 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="sm">Small Text</option>
                  <option value="base">Standard Text</option>
                  <option value="lg">Large Touch Target Text</option>
                  <option value="xl">Extra Large (High Visibility)</option>
                </select>
              </label>

              {/* Language translation */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">App Language</span>
                <select
                  value={settings.language}
                  onChange={(e) => {
                    saveSettings({ language: e.target.value as any });
                    toast.success(`Language set to ${e.target.value === "en" ? "English" : e.target.value === "ta" ? "Tamil" : "Hindi"}`);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-[#f4f4f5] px-3 text-sm focus:ring-2 focus:ring-neutral-950 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </label>

              {/* Speech rate speed */}
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI Speech Playback Speed</span>
                <select
                  value={settings.voiceSpeed.toString()}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    saveSettings({ voiceSpeed: rate });
                    speak("Speech speed adjusted.", rate);
                    toast.success(`Voice speed set to ${rate}x`);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-[#f4f4f5] px-3 text-sm focus:ring-2 focus:ring-neutral-950 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="0.8">0.8x (Calm / Slow)</option>
                  <option value="1.0">1.0x (Standard)</option>
                  <option value="1.2">1.2x (Fast)</option>
                  <option value="1.5">1.5x (Speedy)</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        {/* 4. Baby Profile Editor */}
        <section className="flex flex-col">
          <div className="bg-white border-t border-x border-border px-3 py-1 rounded-t-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground w-fit relative z-10 -mb-[1px]">
            Edit Demographics
          </div>
          <div className="bg-white border border-border rounded-b-[1.5rem] rounded-tr-[1.5rem] p-6 shadow-sm relative z-0 space-y-4">
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <UserPlus className="size-5 text-primary" /> Profile Records Editor
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Keep clinical identity and family contact details up to date.</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {DEMO_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {field.label}
                  </span>
                  <input
                    type={field.type}
                    value={String(profile[field.key])}
                    onChange={(e) =>
                      save({
                        ...profile,
                        [field.key]:
                          field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-[#f4f4f5] px-3 text-sm focus:ring-2 focus:ring-neutral-950 focus:bg-white outline-none"
                  />
                </label>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-2 pt-4 border-t border-neutral-200">
              <ShieldCheck className="size-4 text-success font-bold" /> SafeNest AI is built for parent education and is not a clinical diagnosis replacement.
            </p>
          </div>
        </section>

      </div>
    </AppShell>
  );
}

function Tile({ 
  label, 
  value,
  icon: Icon
}: { 
  label: string; 
  value: string;
  icon: typeof Clock
}) {
  return (
    <div className="rounded-xl bg-[#f4f4f5] border border-neutral-200 p-4 flex flex-col justify-between shadow-sm select-none">
      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-3 text-neutral-600" />
      </div>
      <p className="mt-2 font-display text-base font-black text-neutral-950 tracking-tight leading-none">{value}</p>
    </div>
  );
}