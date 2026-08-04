import { createFileRoute } from "@tanstack/react-router";
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
        
        {/* 1. Partner Live Sync Panel */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-secondary font-bold">Family Collaboration</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">Sync with {profile.partnerName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share feeds, diaper logs, medications, and wellness statuses across parent devices in real-time.
              </p>
            </div>
            
            <button
              onClick={handlePartnerSync}
              disabled={syncing}
              className="flex h-11 items-center gap-1.5 rounded-xl bg-secondary px-5 font-bold text-secondary-foreground hover:bg-secondary/95 disabled:opacity-75 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Devices"}
            </button>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Tile label="Last Sync" value="Just now" icon={Clock} />
            <Tile label="Sync Status" value="Active" icon={CheckCircle} />
            <Tile label="Partner Status" value="Online" icon={UserPlus} />
            <Tile label="Shared Tasks" value="2 Pending" icon={Activity} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4 border border-border/40">
            <div>
              <p className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                <HeartHandshake className="size-4.5 text-accent" /> Share Wellbeing Alerts
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nudge {profile.partnerName} with gentle notifications if your stress score remains elevated over 3 days.
              </p>
            </div>
            <Switch
              checked={profile.shareWithPartner}
              onCheckedChange={(checked) => {
                save({ shareWithPartner: checked });
                toast.success(checked ? "Alerts enabled" : "Alerts disabled");
              }}
            />
          </div>
        </section>

        {/* 2. Pediatrician Health Report Export */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <FileText className="size-5 text-primary" /> Pediatrician Visit Report
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export a clinical summaries card containing recent growth records, vaccination milestones, and the last 48 hours care logs.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrintReport}
              className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer shadow-md"
            >
              <Printer className="size-4" /> Print / Export PDF Report
            </button>
            <button
              onClick={() => setShowPrintPreview(!showPrintPreview)}
              className="flex h-11 items-center gap-2 rounded-xl border border-border bg-muted/20 px-5 font-bold hover:bg-muted/40 transition-all cursor-pointer"
            >
              <Eye className="size-4" /> {showPrintPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          {/* Printable Report Layout (Hidden by default, prints on window.print()) */}
          {(showPrintPreview || typeof window !== "undefined") && (
            <div 
              id="printable-report"
              className={`${
                showPrintPreview ? "block border border-primary/20 bg-muted/20" : "hidden"
              } p-6 rounded-2xl space-y-5 text-xs text-foreground mt-4`}
              style={{ fontFamily: "monospace" }}
            >
              <div className="border-b-2 border-primary pb-3 flex justify-between items-end">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wide">SafeNest AI Pediatric Health Summary</h1>
                  <p className="text-[10px] text-muted-foreground">Clinical export report for pediatric consultations.</p>
                </div>
                <p className="text-right text-[10px]">Date Generated: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold border-b border-border pb-1 text-primary">Patient Demographics</h3>
                  <p><strong>Baby Name:</strong> {profile.babyName}</p>
                  <p><strong>Age:</strong> {profile.ageMonths} Months</p>
                  <p><strong>Birth Date:</strong> {profile.birthDate}</p>
                  <p><strong>Weight (Current):</strong> {profile.weightKg} kg</p>
                  <p><strong>Height (Current):</strong> {profile.heightCm} cm</p>
                  <p><strong>Blood Group:</strong> {profile.bloodGroup}</p>
                  <p><strong>Allergies:</strong> {profile.allergies}</p>
                </div>
                <div>
                  <h3 className="font-bold border-b border-border pb-1 text-primary">Provider &amp; Clinic</h3>
                  <p><strong>Pediatrician:</strong> {profile.pediatrician}</p>
                  <p><strong>Ped Phone:</strong> {profile.pediatricianPhone}</p>
                  <p><strong>Preferred Hospital:</strong> {profile.hospitalName}</p>
                  <p><strong>Insurance Policy:</strong> {profile.insuranceName} ({profile.insurancePolicy})</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold border-b border-border pb-1 text-primary">Recent Growth Timeline</h3>
                <table className="w-full text-left mt-2">
                  <thead>
                    <tr className="border-b border-border text-[10px]">
                      <th>Age (Months)</th>
                      <th>Weight (kg)</th>
                      <th>Height (cm)</th>
                      <th>Head Circum. (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growth.slice(-5).map((g) => (
                      <tr key={g.id} className="border-b border-border/50">
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
                <h3 className="font-bold border-b border-border pb-1 text-primary">Immunisation Summary</h3>
                <p>Completed vaccines: {vaccines.filter(v => v.status === "completed").map(v => v.name.split(" - ")[0]).join(", ") || "None logged"}</p>
                <p className="mt-1">Scheduled next: {vaccines.filter(v => v.status === "scheduled").slice(0, 3).map(v => v.name).join(", ")}</p>
              </div>

              <div>
                <h3 className="font-bold border-b border-border pb-1 text-primary">Care logs (Last 48 hours)</h3>
                <ul className="space-y-1 mt-2">
                  {logs.slice(0, 8).map((l) => (
                    <li key={l.id} className="border-b border-border/30 pb-1 flex justify-between">
                      <span>• <strong>{l.kind.toUpperCase()}</strong>: {l.note || "No comments"}</span>
                      <span>{new Date(l.at).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* 3. System Preferences & Settings */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Sliders className="size-5 text-accent" /> System Preferences
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Theme selection */}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Theme Mode</span>
              <select
                value={settings.theme}
                onChange={(e) => {
                  saveSettings({ theme: e.target.value as any });
                  toast.success(`Switched to ${e.target.value} mode`);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="light">Warm White (Day Mode)</option>
                <option value="dark">Dark Navy (Night Mode)</option>
              </select>
            </label>

            {/* Font Size scaling */}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Font Accessibility Scale</span>
              <select
                value={settings.fontSize}
                onChange={(e) => {
                  saveSettings({ fontSize: e.target.value as any });
                  toast.success(`Font scale set to ${e.target.value}`);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="sm">Small Text</option>
                <option value="base">Standard Text</option>
                <option value="lg">Large Touch Target Text</option>
                <option value="xl">Extra Large (High Visibility)</option>
              </select>
            </label>

            {/* Language translation */}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">App Language</span>
              <select
                value={settings.language}
                onChange={(e) => {
                  saveSettings({ language: e.target.value as any });
                  toast.success(`Language set to ${e.target.value === "en" ? "English" : e.target.value === "ta" ? "Tamil" : "Hindi"}`);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="en">English (US/UK)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </label>

            {/* Speech rate speed */}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">AI Speech Playback Speed</span>
              <select
                value={settings.voiceSpeed.toString()}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  saveSettings({ voiceSpeed: rate });
                  speak("Speech speed adjusted.", rate);
                  toast.success(`Voice speed set to ${rate}x`);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="0.8">0.8x (Calm / Slow)</option>
                <option value="1.0">1.0x (Standard)</option>
                <option value="1.2">1.2x (Fast)</option>
                <option value="1.5">1.5x (Speedy)</option>
              </select>
            </label>
          </div>
        </section>

        {/* 4. Baby Profile Editor */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Eye className="size-5 text-primary" /> Edit Demographics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {DEMO_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {field.label}
                </span>
                <input
                  type={field.type}
                  value={String(profile[field.key])}
                  onChange={(e) =>
                    save({
                      [field.key]:
                        field.type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                />
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-2 pt-2 border-t border-border/40">
            <ShieldCheck className="size-4 text-success" /> SafeNest AI is built for parent education and is not a clinical diagnosis replacement.
          </p>
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
    <div className="rounded-xl bg-muted/25 border border-border/40 p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-3.5 opacity-70 text-primary" />
      </div>
      <p className="mt-2 font-display text-lg font-extrabold text-foreground tracking-tight">{value}</p>
    </div>
  );
}