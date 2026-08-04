import { createFileRoute } from "@tanstack/react-router";
import { 
  Activity, 
  Calendar, 
  CheckCircle, 
  FileText, 
  Plus, 
  ShieldCheck, 
  Trash2, 
  TrendingUp, 
  UploadCloud, 
  User, 
  AlertCircle 
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

import { AppShell } from "@/components/safenest/AppShell";
import { 
  useProfile, 
  useGrowthRecords, 
  useVaccinations, 
  useVaultDocuments, 
  useSafeNestSettings 
} from "@/lib/safenest/store";
import { speak } from "@/lib/safenest/speech";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Baby Profile, Growth & Vaccinations — SafeNest AI" },
      {
        name: "description",
        content: "Track growth against WHO percentiles, monitor upcoming immunisations, and manage pediatric files in a secure document vault.",
      },
    ],
  }),
  component: ProfilePage,
});

// WHO weight-for-age percentiles for girls (0 to 12 months) in kg
const WHO_CURVES = [
  { month: 0, p15: 2.8, p50: 3.2, p85: 3.7 },
  { month: 1, p15: 3.6, p50: 4.2, p85: 4.8 },
  { month: 2, p15: 4.5, p50: 5.1, p85: 5.8 },
  { month: 3, p15: 5.2, p50: 5.8, p85: 6.6 },
  { month: 4, p15: 5.7, p50: 6.4, p85: 7.3 },
  { month: 5, p15: 6.1, p50: 6.9, p85: 7.8 },
  { month: 6, p15: 6.5, p50: 7.3, p85: 8.2 },
  { month: 7, p15: 6.8, p50: 7.6, p85: 8.6 },
  { month: 8, p15: 7.0, p50: 7.9, p85: 9.0 },
  { month: 9, p15: 7.3, p50: 8.2, p85: 9.3 },
  { month: 10, p15: 7.5, p50: 8.5, p85: 9.6 },
  { month: 11, p15: 7.7, p50: 8.7, p85: 9.9 },
  { month: 12, p15: 7.9, p50: 8.9, p85: 10.1 },
];

function ProfilePage() {
  const { profile } = useProfile();
  const { growth, addGrowth } = useGrowthRecords();
  const { vaccines, toggleVaccine } = useVaccinations();
  const { documents, addDocument, deleteDocument } = useVaultDocuments();
  const { settings } = useSafeNestSettings();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"growth" | "vaccines" | "vault">("growth");
  
  // Growth entry state
  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");
  
  // Document vault upload simulation state
  const [docName, setDocName] = useState("");
  const [docCat, setDocCat] = useState<"prescription" | "vaccination_card" | "lab_report" | "pediatrician_note">("prescription");
  const [docDr, setDocDr] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    const h = parseFloat(newHeight);
    if (!w || !h) {
      toast.error("Please enter valid weight and height measurements.");
      return;
    }
    addGrowth(w, h);
    setNewWeight("");
    setNewHeight("");
    toast.success("Growth record logged successfully", {
      description: `${w} kg and ${h} cm added for Month ${profile.ageMonths}.`
    });
    speak("Growth record saved.");
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error("Please enter a document name.");
      return;
    }
    setUploading(true);
    setTimeout(() => {
      addDocument(docName.trim(), docCat, docDr.trim() || undefined, "1.4 MB");
      setDocName("");
      setDocDr("");
      setUploading(false);
      toast.success("Document uploaded to vault");
      speak("Document saved securely.");
    }, 1200);
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading medical profile...</p>
        </div>
      </AppShell>
    );
  }

  // Compile chart data merging WHO Percentiles + Baby Growth Points
  const chartData = WHO_CURVES.map((item) => {
    const babyPoint = growth.find((g) => g.ageMonths === item.month);
    return {
      month: `M${item.month}`,
      "15th %": item.p15,
      "50th % (Median)": item.p50,
      "85th %": item.p85,
      [profile.babyName]: babyPoint ? babyPoint.weightKg : undefined,
    };
  });

  const upcomingVaccines = vaccines.filter(v => v.status === "scheduled").slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Baby Info Card Header */}
        <section className="glass-card rounded-[2rem] p-6 relative overflow-hidden">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <User className="size-8" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pediatric Demographic</p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight mt-0.5">{profile.babyName}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Born: {profile.birthDate} · Age: <span className="font-semibold text-foreground">{profile.ageMonths} months</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-2xl bg-muted/40 p-3 text-center border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight</p>
                <p className="font-display text-lg font-bold text-primary mt-0.5">{profile.weightKg} kg</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 text-center border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Height</p>
                <p className="font-display text-lg font-bold text-secondary mt-0.5">{profile.heightCm} cm</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 text-center border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Blood Type</p>
                <p className="font-display text-lg font-bold text-destructive mt-0.5">{profile.bloodGroup}</p>
              </div>
            </div>
          </div>
          
          {/* Subtle details */}
          <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground block">Pediatrician</span>
              {profile.pediatrician} ({profile.pediatricianPhone})
            </div>
            <div>
              <span className="font-semibold text-foreground block">Preferred Hospital</span>
              {profile.hospitalName}
            </div>
            <div>
              <span className="font-semibold text-foreground block">Insurance Details</span>
              {profile.insuranceName} ({profile.insurancePolicy})
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-border/50">
          {(["growth", "vaccines", "vault"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-sm font-bold tracking-wide uppercase border-b-2 transition-all ${
                activeTab === tab 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "growth" ? "WHO Growth Charts" : tab === "vaccines" ? "Vaccination Timeline" : "Document Vault"}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}

        {/* 1. Growth & WHO Percentiles */}
        {activeTab === "growth" && (
          <div className="space-y-6">
            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="size-5 text-primary" /> WHO Weight Percentiles (Girls 0–12M)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Plotting {profile.babyName}&apos;s weight timeline against standard WHO child development distributions.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 md:mt-0">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#ef4444]" /> 85th Percentile</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#10b981]" /> 50th (Median)</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#3b82f6]" /> 15th Percentile</span>
                </div>
              </div>

              {/* Chart Wrapper */}
              <div className="h-80 w-full pr-4 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                    <YAxis domain={[2, 13]} stroke="var(--color-muted-foreground)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "var(--color-card)", 
                        borderColor: "var(--color-border)",
                        borderRadius: "1rem",
                        color: "var(--color-foreground)"
                      }} 
                    />
                    <Line type="monotone" dataKey="85th %" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="50th % (Median)" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="15th %" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey={profile.babyName} 
                      stroke="var(--color-primary)" 
                      strokeWidth={3} 
                      connectNulls 
                      dot={{ r: 5, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth Form */}
            <div className="glass-card rounded-[2rem] p-6">
              <h3 className="font-display text-lg font-bold">Add Growth measurement</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Record weight and height for Month {profile.ageMonths}.</p>
              <form onSubmit={handleAddGrowth} className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Weight (kg)</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="e.g. 6.5"
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Height (cm)</span>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    placeholder="e.g. 63.5"
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
                  >
                    <Plus className="size-4" /> Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Vaccination Timeline */}
        {activeTab === "vaccines" && (
          <div className="space-y-6">
            {/* Quick alert */}
            {upcomingVaccines.length > 0 && (
              <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-warning flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Upcoming Vaccinations Alert</p>
                  <p className="text-xs text-foreground/80 mt-0.5">
                    {profile.babyName} has {upcomingVaccines.length} vaccinations scheduled. Follow up with {profile.pediatrician} soon.
                  </p>
                </div>
              </div>
            )}

            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <CheckCircle className="size-5 text-success" /> Immunisation Records
                  </h2>
                  <p className="text-xs text-muted-foreground">Standard pediatric schedule (AAP &amp; WHO compatible).</p>
                </div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                  {vaccines.filter(v => v.status === "completed").length} / {vaccines.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {vaccines.map((v) => (
                  <div 
                    key={v.id} 
                    onClick={() => {
                      toggleVaccine(v.id);
                      toast.success(
                        v.status === "completed" 
                          ? `${v.name} marked as Scheduled` 
                          : `${v.name} marked as Completed`
                      );
                    }}
                    className={`flex items-start gap-4 rounded-2xl p-4 border transition-all cursor-pointer ${
                      v.status === "completed" 
                        ? "bg-success/5 border-success/20 text-success/90" 
                        : "bg-muted/30 border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={v.status === "completed"} 
                      onChange={() => {}} // handled by parent div click
                      className="mt-1 size-4 rounded border-gray-300 text-success focus:ring-success"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-foreground text-sm">{v.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          v.dueAgeMonths === 0 ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                        }`}>
                          {v.dueAgeMonths === 0 ? "At Birth" : `${v.dueAgeMonths} Months`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Protects against: {v.disease}</p>
                      <p className="text-xs text-muted-foreground italic mt-1">{v.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Document Vault */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            <div className="glass-card rounded-[2rem] p-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <UploadCloud className="size-5 text-primary" /> Security Document Vault
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload prescriptions, reports, and vaccination cards. Files are stored securely on this browser only.
              </p>

              {/* Upload form */}
              <form onSubmit={handleUploadDoc} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Document Name</span>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. Vaccine Certificate.pdf"
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Category</span>
                    <select
                      value={docCat}
                      onChange={(e) => setDocCat(e.target.value as any)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    >
                      <option value="prescription">Prescription</option>
                      <option value="vaccination_card">Vaccination Card</option>
                      <option value="lab_report">Lab Report</option>
                      <option value="pediatrician_note">Pediatrician Visit Note</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Doctor Name (Optional)</span>
                    <input
                      type="text"
                      value={docDr}
                      onChange={(e) => setDocDr(e.target.value)}
                      placeholder="e.g. Dr. Meera Rao"
                      className="mt-1.5 h-11 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/95 disabled:opacity-70 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <span>Uploading secures file...</span>
                  ) : (
                    <>
                      <UploadCloud className="size-4" /> Securely Upload File
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Documents List */}
            <div className="glass-card rounded-[2rem] p-6">
              <h3 className="font-display text-lg font-bold mb-4">Saved Documents ({documents.length})</h3>
              
              {documents.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground border border-border">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{doc.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Category: <span className="font-medium text-foreground capitalize">{doc.category.replace("_", " ")}</span>
                            {doc.doctorName && ` · Dr: ${doc.doctorName}`}
                            {doc.fileSize && ` · Size: ${doc.fileSize}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          deleteDocument(doc.id);
                          toast.success("Document deleted");
                        }}
                        className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No documents in vault yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
