import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TEST_CV } from "@/test/fixtures/test-cv";
import { TEST_JOBS, type TestJob } from "@/test/fixtures/test-jobs";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Briefcase,
  Trash,
  SpinnerGap,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "@phosphor-icons/react";

type ActionState = "idle" | "loading" | "success" | "error";

export default function DevTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvState, setCvState] = useState<ActionState>("idle");
  const [jobStates, setJobStates] = useState<Record<string, ActionState>>({});
  const [cleanState, setCleanState] = useState<ActionState>("idle");

  if (!import.meta.env.DEV) {
    return <p className="text-destructive p-8">Questa pagina è disponibile solo in sviluppo.</p>;
  }

  const loadTestCV = async () => {
    if (!user) return;
    setCvState("loading");
    try {
      // Deactivate existing CVs
      await supabase
        .from("master_cvs")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Insert fixture
      const { error } = await supabase.from("master_cvs").insert({
        user_id: user.id,
        parsed_data: TEST_CV as any,
        file_name: "CV_Test_Giulia.pdf",
        source: "test",
        is_active: true,
      });

      if (error) throw error;
      setCvState("success");
      toast.success("CV di test caricato");
    } catch (e: any) {
      setCvState("error");
      toast.error("Errore: " + e.message);
    }
  };

  const launchJob = async (job: TestJob) => {
    if (!user) return;
    setJobStates((s) => ({ ...s, [job.id]: "loading" }));
    try {
      const { data, error } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company_name: job.company_name,
          role_title: job.role_title,
          job_description: job.description,
          status: "draft",
        })
        .select("id")
        .single();

      if (error) throw error;
      setJobStates((s) => ({ ...s, [job.id]: "success" }));
      toast.success(`Bozza creata: ${job.role_title}`);
      navigate(`/app/nuova?draft=${data.id}`);
    } catch (e: any) {
      setJobStates((s) => ({ ...s, [job.id]: "error" }));
      toast.error("Errore: " + e.message);
    }
  };

  const cleanAll = async () => {
    if (!user) return;
    setCleanState("loading");
    try {
      // Delete tailored_cvs first (FK)
      await supabase.from("tailored_cvs").delete().eq("user_id", user.id);
      await supabase.from("applications").delete().eq("user_id", user.id);
      await supabase.from("master_cvs").delete().eq("user_id", user.id);
      setCleanState("success");
      toast.success("Tutti i dati di test eliminati");
    } catch (e: any) {
      setCleanState("error");
      toast.error("Errore: " + e.message);
    }
  };

  const stateIcon = (s: ActionState) => {
    if (s === "loading") return <SpinnerGap size={18} className="animate-spin text-muted-foreground" />;
    if (s === "success") return <CheckCircle size={18} weight="fill" className="text-primary" />;
    if (s === "error") return <XCircle size={18} weight="fill" className="text-destructive" />;
    return null;
  };

  const matchColor = (m: TestJob["expected_match"]) => {
    if (m === "alto") return "text-primary";
    if (m === "medio") return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Dev Test <span className="text-primary">⚡</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Azioni rapide per testare il flusso end-to-end con dati fixture.
        </p>
      </div>

      {/* Load test CV */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={20} /> Carica CV di test
          </CardTitle>
          <CardDescription>
            Inserisce il CV di Giulia La Porta (parsato) come CV attivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadTestCV} disabled={cvState === "loading"} className="gap-2">
            Carica CV {stateIcon(cvState)}
          </Button>
        </CardContent>
      </Card>

      {/* Job tests */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase size={20} /> Annunci di test
          </CardTitle>
          <CardDescription>
            Crea una bozza di candidatura e apre il wizard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TEST_JOBS.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-border/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{job.role_title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.company_name} · {job.location} ·{" "}
                  <span className={matchColor(job.expected_match)}>
                    Match {job.expected_match} ({job.expected_score_range[0]}-{job.expected_score_range[1]}%)
                  </span>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => launchJob(job)}
                disabled={jobStates[job.id] === "loading"}
                className="ml-3 gap-1.5 shrink-0"
              >
                Testa <ArrowRight size={14} />
                {stateIcon(jobStates[job.id] ?? "idle")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Clean */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash size={20} /> Pulisci dati di test
          </CardTitle>
          <CardDescription>
            Elimina TUTTE le candidature, CV tailored e master CV dell'utente corrente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={cleanAll} disabled={cleanState === "loading"} className="gap-2">
            Elimina tutto {stateIcon(cleanState)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
