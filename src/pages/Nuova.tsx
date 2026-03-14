import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { SpinnerGap, FileArrowUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import { StepIndicator } from "@/components/wizard/StepIndicator";
import { StepAnnuncio } from "@/components/wizard/StepAnnuncio";
import { StepVerifica } from "@/components/wizard/StepVerifica";
import { StepTailoring } from "@/components/wizard/StepTailoring";
import { StepRevisione } from "@/components/wizard/StepRevisione";
import { StepExport } from "@/components/wizard/StepExport";
import { StepCompleta } from "@/components/wizard/StepCompleta";
import { computeConfidence } from "@/components/wizard/wizard-utils";
import type { JobData, PrescreenResult, AnalyzeResult, TailorResult } from "@/components/wizard/wizard-types";
import { useSubscription } from "@/hooks/useSubscription";
import { useProGate } from "@/hooks/useProGate";

export default function Nuova() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPro, loading } = useSubscription();
  const checkCanCreate = useProGate();
  const [proChecked, setProChecked] = useState(false);
  const [step, setStep] = useState(() => {
    const s = parseInt(searchParams.get("step") || "0", 10);
    return isNaN(s) ? 0 : s;
  });
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [jobUrl, setJobUrl] = useState<string | undefined>();
  const [prescreenResult, setPrescreenResult] = useState<PrescreenResult | null>(null);
  const [prescreening, setPrescreening] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [cvCheck, setCvCheck] = useState<"loading" | "ok" | "missing">("loading");
  const [applicationId, setApplicationId] = useState<string | null>(searchParams.get("draft"));
  const [userAnswers, setUserAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [originalCv, setOriginalCv] = useState<Record<string, unknown> | null>(null);
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const [overriddenSkills, setOverriddenSkills] = useState<Set<string>>(new Set());
  const draftLoadedId = useRef<string | null>(null);

  const updateStep = useCallback((newStep: number) => {
    setStep(newStep);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("step", String(newStep));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Pro gate — only for new applications (not draft resumption)
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (draftId) { setProChecked(true); return; }
    if (!user) return;
    if (loading) return;
    checkCanCreate(isPro).then((ok) => {
      if (ok) setProChecked(true);
    });
  }, [user, isPro, loading, checkCanCreate, searchParams]);

  // CV Guard
  useEffect(() => {
    if (!user) return;
    supabase.from("master_cvs").select("id").eq("user_id", user.id).eq("is_active", true).limit(1)
      .then(({ data }) => setCvCheck(data && data.length > 0 ? "ok" : "missing"));
  }, [user]);

  // Draft resumption
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId || !user || draftLoadedId.current === draftId) return;
    draftLoadedId.current = draftId;

    (async () => {
      const { data: app } = await supabase.from("applications").select("*").eq("id", draftId).single();
      if (!app) { toast.error("Bozza non trovata."); return; }

      setApplicationId(app.id);
      setJobData({
        company_name: app.company_name,
        role_title: app.role_title,
        description: app.job_description || "",
        location: "",
        key_requirements: [],
        required_skills: [],
      });
      if (app.job_url) setJobUrl(app.job_url);
      if ((app as any).user_answers) setUserAnswers((app as any).user_answers);
      if ((app as any).skills_overridden) setOverriddenSkills(new Set((app as any).skills_overridden));

      const { data: tc } = await supabase.from("tailored_cvs").select("*").eq("application_id", draftId).maybeSingle();

      if (tc?.tailored_data) {
        setAnalyzeResult({
          match_score: app.match_score ?? 0,
          ats_score: tc.ats_score ?? 0,
          skills_present: (tc.skills_match as any)?.present || [],
          skills_missing: (tc.skills_match as any)?.missing || [],
          seniority_match: tc.seniority_match as any || { candidate_level: "", role_level: "", match: true, note: "" },
          ats_checks: (tc.ats_checks as any) || [],
          detected_language: "it",
          master_cv_id: tc.master_cv_id,
        });
        setTailorResult({
          tailored_cv: tc.tailored_data as Record<string, unknown>,
          honest_score: (tc.honest_score as any) || { confidence: 100, experiences_added: 0, skills_invented: 0, dates_modified: 0, bullets_repositioned: 0, bullets_rewritten: 0, sections_removed: 0, flags: [] },
          diff: (tc.diff as any) || [],
          master_cv_id: tc.master_cv_id,
        });
        supabase.from("master_cvs").select("parsed_data").eq("id", tc.master_cv_id).single()
          .then(({ data: mcv }) => { if (mcv?.parsed_data) setOriginalCv(mcv.parsed_data as Record<string, unknown>); });

        const urlStep = parseInt(searchParams.get("step") || "3", 10);
        updateStep(urlStep >= 3 ? urlStep : 3);
      } else if (app.job_description) {
        if ((app as any).prescreen_data) {
          setPrescreenResult((app as any).prescreen_data);
          updateStep(1);
        } else {
          updateStep(1);
          setPrescreening(true);
          const { data: draftProfile } = await supabase.from("profiles").select("salary_expectations").eq("user_id", user.id).single();
          const draftBody: Record<string, unknown> = { job_data: { company_name: app.company_name, role_title: app.role_title, description: app.job_description, location: "", key_requirements: [], required_skills: [] } };
          if (draftProfile?.salary_expectations) draftBody.salary_expectations = draftProfile.salary_expectations;
          supabase.functions.invoke("ai-prescreen", { body: draftBody }).then(({ data: result, error }) => {
            if (error || result?.error) { toast.error("Errore durante il pre-screening"); updateStep(0); }
            else {
              setPrescreenResult(result);
              supabase.from("applications").update({ prescreen_data: result } as any).eq("id", applicationId).then(() => {});
            }
          }).finally(() => setPrescreening(false));
        }
      }
    })();
  }, [searchParams, user, updateStep]);

  // Cached analyze result from parallel call
  const cachedAnalyzeRef = useRef<AnalyzeResult | null>(null);

  // Step 0 → Step 1 (parallel: prescreen + analyze)
  const handleAnnuncioConfirm = async (data: JobData, url?: string, _text?: string) => {
    if (!user) return;
    setJobData(data);
    setJobUrl(url);
    updateStep(1);
    setPrescreening(true);
    setPrescreenResult(null);
    cachedAnalyzeRef.current = null;

    try {
      let appId = applicationId;
      if (!appId) {
        const { data: draftApp, error: draftErr } = await supabase
          .from("applications").insert({ user_id: user.id, company_name: data.company_name, role_title: data.role_title, job_url: url || null, job_description: data.description, status: "draft" })
          .select("id").single();
        if (draftErr) throw draftErr;
        appId = draftApp.id;
        setApplicationId(appId);
        setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("draft", appId!); next.set("step", "1"); return next; }, { replace: true });
      }

      const { data: profile } = await supabase.from("profiles").select("salary_expectations").eq("user_id", user.id).single();
      const prescreenBody: Record<string, unknown> = { job_data: data };
      if (profile?.salary_expectations) prescreenBody.salary_expectations = profile.salary_expectations;

      // Launch prescreen + analyze in parallel
      const [prescreenRes, analyzeRes] = await Promise.all([
        supabase.functions.invoke("ai-prescreen", { body: prescreenBody }),
        supabase.functions.invoke("ai-tailor", { body: { job_data: data, mode: "analyze" } }),
      ]);

      // Handle prescreen result
      if (prescreenRes.error) throw prescreenRes.error;
      if (prescreenRes.data?.error) throw new Error(prescreenRes.data.error);
      setPrescreenResult(prescreenRes.data);
      if (appId) {
        supabase.from("applications").update({ prescreen_data: prescreenRes.data } as any).eq("id", appId).then(() => {});
      }

      // Cache analyze result (don't set state yet — user hasn't proceeded)
      if (!analyzeRes.error && analyzeRes.data && !analyzeRes.data.error) {
        cachedAnalyzeRef.current = analyzeRes.data;
        if (appId) {
          supabase.from("applications").update({ match_score: analyzeRes.data.match_score } as any).eq("id", appId).then(() => {});
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il pre-screening");
      updateStep(0);
    } finally {
      setPrescreening(false);
    }
  };

  // Step 1 → Step 2
  const handleVerificaProceed = async (answers: { question: string; answer: string }[]) => {
    if (!user || !jobData) return;
    setUserAnswers(answers);
    updateStep(2);

    if (applicationId && answers.length > 0) {
      supabase.from("applications").update({ user_answers: answers } as any).eq("id", applicationId).then(() => {});
    }

    // Use cached analyze if available (from parallel call), otherwise fetch
    if (cachedAnalyzeRef.current && answers.length === 0) {
      setAnalyzeResult(cachedAnalyzeRef.current);
      setLanguageOverride(cachedAnalyzeRef.current.detected_language || "it");
      return;
    }

    setAnalyzing(true);
    setAnalyzeResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: { job_data: jobData, user_answers: answers.length > 0 ? answers : undefined, mode: "analyze" },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (applicationId) {
        await supabase.from("applications").update({ match_score: result.match_score } as any).eq("id", applicationId);
      }

      setAnalyzeResult(result);
      setLanguageOverride(result.detected_language || "it");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'analisi AI");
      updateStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2 → Step 3
  const handleGenerateCv = async () => {
    if (!user || !jobData || !analyzeResult) return;
    setTailoring(true);
    setTailorResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: {
          job_data: jobData,
          user_answers: userAnswers.length > 0 ? userAnswers : undefined,
          mode: "tailor",
          analyze_context: { match_score: analyzeResult.match_score, skills_missing: analyzeResult.skills_missing.filter(s => !overriddenSkills.has(s.label)), detected_language: languageOverride || analyzeResult.detected_language, skills_overridden: Array.from(overriddenSkills) },
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // cv-review rules are now integrated into ai-tailor prompt — no separate call needed
      setTailorResult(result);

      if (result.original_cv) {
        setOriginalCv(result.original_cv);
      } else if (result.master_cv_id) {
        const { data: mcv } = await supabase.from("master_cvs").select("parsed_data").eq("id", result.master_cv_id).single();
        if (mcv?.parsed_data) setOriginalCv(mcv.parsed_data as Record<string, unknown>);
      }

      const frontendConfidence = computeConfidence(result.original_cv ?? null, reviewedCv, result.diff ?? []);

      if (applicationId) {
        const tcPayload = {
          user_id: user.id,
          application_id: applicationId,
          master_cv_id: result.master_cv_id,
          tailored_data: reviewedCv as any,
          skills_match: { present: analyzeResult.skills_present || [], missing: analyzeResult.skills_missing || [] } as any,
          suggestions: result.diff as any,
          ats_score: analyzeResult.ats_score,
          ats_checks: analyzeResult.ats_checks as any,
          seniority_match: analyzeResult.seniority_match as any,
          honest_score: { ...((result.honest_score as any) ?? {}), confidence: frontendConfidence.confidence, confidence_details: frontendConfidence } as any,
          diff: result.diff as any,
          score_note: analyzeResult.score_note || null,
          learning_suggestions: analyzeResult.learning_suggestions as any || null,
          structural_changes: result.structural_changes as any || null,
        };

        const { data: existingTc } = await supabase.from("tailored_cvs").select("id").eq("application_id", applicationId).maybeSingle();
        if (existingTc) {
          await supabase.from("tailored_cvs").update(tcPayload as any).eq("id", existingTc.id);
        } else {
          await supabase.from("tailored_cvs").insert([tcPayload as any]);
        }

        if (overriddenSkills.size > 0) {
          await supabase.from("applications").update({ skills_overridden: Array.from(overriddenSkills) } as any).eq("id", applicationId);
        }
      }

      updateStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante la generazione del CV";
      if (msg === "UPGRADE_REQUIRED" || (typeof msg === "string" && msg.includes("UPGRADE_REQUIRED"))) {
        navigate("/upgrade");
        return;
      }
      toast.error(msg);
    } finally {
      setTailoring(false);
    }
  };

  const handleMarkSent = async () => {
    if (applicationId) {
      await supabase.from("applications").update({ status: "inviata" } as any).eq("id", applicationId);
    }
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    toast.success("Candidatura segnata come inviata!");
    navigate("/app/candidature");
  };

  const handleKeepDraft = () => {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    toast.success("Bozza salvata.");
    navigate("/app/home");
  };

  const handleNewApplication = () => {
    setStep(0);
    setJobData(null);
    setJobUrl(undefined);
    setPrescreenResult(null);
    setAnalyzeResult(null);
    setTailorResult(null);
    setOriginalCv(null);
    setApplicationId(null);
    setUserAnswers([]);
    setLanguageOverride(null);
    setOverriddenSkills(new Set());
    setSearchParams({}, { replace: true });
  };

  const handleAbandon = () => handleNewApplication();

  if (cvCheck === "loading" || !proChecked || loading) {
    return <div className="flex items-center justify-center py-20"><SpinnerGap size={32} className="text-primary animate-spin" /></div>;
  }

  if (cvCheck === "missing") {
    const draftId = searchParams.get("draft");
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <FileArrowUp size={48} className="text-primary mx-auto" />
        <div>
          <h2 className="font-display text-2xl font-bold">{draftId && jobData ? `Per riprendere "${jobData.role_title}" serve il tuo CV` : "CV necessario"}</h2>
          <p className="text-muted-foreground mt-2">{draftId ? "Il CV master è stato rimosso. Ricaricalo per continuare con questa candidatura." : "Per creare una candidatura, devi prima caricare il tuo CV."}</p>
        </div>
        <Button onClick={() => navigate("/onboarding")} className="gap-2"><FileArrowUp size={16} /> Carica il tuo CV</Button>
      </div>
    );
  }

  return (
    <div className="py-6 px-2">
      <StepIndicator current={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && <StepAnnuncio onConfirm={handleAnnuncioConfirm} initialJobData={jobData} />}
          {step === 1 && (
            <StepVerifica
              prescreenResult={prescreenResult}
              loading={prescreening}
              onProceed={handleVerificaProceed}
              onBack={() => updateStep(0)}
            />
          )}
          {step === 2 && (
            <StepTailoring
              analyzeResult={analyzeResult}
              analyzeLoading={analyzing}
              tailoring={tailoring}
              onGenerateCv={handleGenerateCv}
              onAbandon={handleAbandon}
              onBack={() => updateStep(1)}
              selectedLanguage={languageOverride || analyzeResult?.detected_language || "it"}
              onLanguageChange={setLanguageOverride}
              overriddenSkills={overriddenSkills}
              onToggleSkill={(skill) => setOverriddenSkills((prev) => {
                const next = new Set(prev);
                if (next.has(skill)) next.delete(skill);
                else next.add(skill);
                return next;
              })}
            />
          )}
          {step === 3 && tailorResult && (
            <StepRevisione
              tailorResult={tailorResult}
              analyzeResult={analyzeResult}
              originalCv={originalCv}
              onNext={() => updateStep(4)}
              onBack={() => updateStep(2)}
            />
          )}
          {step === 4 && tailorResult && jobData && applicationId && (
            <StepExport
              tailoredCv={tailorResult.tailored_cv}
              analyzeResult={analyzeResult}
              tailorResult={tailorResult}
              jobData={jobData}
              applicationId={applicationId}
              cvLang={languageOverride || analyzeResult?.detected_language}
              onBack={() => updateStep(3)}
              onNext={() => updateStep(5)}
            />
          )}
          {step === 5 && jobData && applicationId && (
            <StepCompleta
              jobData={jobData}
              applicationId={applicationId}
              onMarkSent={handleMarkSent}
              onKeepDraft={handleKeepDraft}
              onNewApplication={handleNewApplication}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
