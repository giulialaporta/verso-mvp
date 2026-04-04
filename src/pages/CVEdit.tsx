import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CVSections } from "@/components/CVSections";
import { CVOptimizationTips, type OptimizationTip } from "@/components/CVOptimizationTips";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, FloppyDisk, MagicWand, Check } from "@phosphor-icons/react";
import type { ParsedCV } from "@/types/cv";

export default function CVEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvId, setCvId] = useState<string | null>(null);
  const [data, setData] = useState<ParsedCV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [aiTips, setAiTips] = useState<OptimizationTip[]>([]);
  const [cvOptimized, setCvOptimized] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("master_cvs")
      .select("id, parsed_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data: cv }) => {
        if (cv) {
          setCvId(cv.id);
          setData(cv.parsed_data as unknown as ParsedCV);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!cvId || !data) return;
    setSaving(true);
    const { error } = await supabase
      .from("master_cvs")
      .update({ parsed_data: data as any })
      .eq("id", cvId);
    setSaving(false);
    if (error) {
      toast.error("Errore durante il salvataggio.");
    } else {
      toast.success("CV salvato con successo.");
      navigate("/app/home");
    }
  };

  const handleOptimize = async () => {
    if (!data) return;
    setOptimizing(true);
    setCvOptimized(false);
    setAiTips([]);
    try {
      const originalSnapshot = JSON.stringify(data);
      const { data: optData, error } = await supabase.functions.invoke("cv-optimize", {
        body: { cv_data: data },
      });
      if (error || !optData?.optimized_cv) {
        toast.error("Ottimizzazione non riuscita. Riprova.");
        return;
      }
      const hasChanges = JSON.stringify(optData.optimized_cv) !== originalSnapshot;
      if (hasChanges) {
        setData(optData.optimized_cv as unknown as ParsedCV);
        setCvOptimized(true);
        toast.success("CV ottimizzato!");
      } else {
        toast("Il tuo CV è già in ottima forma!");
      }
      if (Array.isArray(optData.tips) && optData.tips.length > 0) {
        setAiTips(optData.tips as OptimizationTip[]);
      }
    } catch {
      toast.error("Errore durante l'ottimizzazione.");
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 text-center space-y-4 pt-12">
        <p className="text-muted-foreground">Nessun CV trovato.</p>
        <Button variant="outline" onClick={() => navigate("/app/home")}>Torna alla dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/home")} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Torna alla dashboard">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-bold tracking-tight">Modifica CV</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOptimize} disabled={optimizing} className="gap-2">
            <MagicWand size={16} />
            {optimizing ? "Ottimizzazione..." : "Ottimizza con AI"}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <FloppyDisk size={16} />
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Modifica qualsiasi campo toccandolo. Le modifiche verranno usate per le prossime candidature.
      </p>

      {cvOptimized && (
        <div className="flex gap-3 rounded-lg border-l-[3px] border-primary bg-surface p-3">
          <Check size={16} weight="bold" className="text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">CV ottimizzato.</span>{" "}
            Abbiamo migliorato la formattazione. Rivedi e salva quando sei soddisfatto.
          </p>
        </div>
      )}

      {aiTips.length > 0 && (
        <CVOptimizationTips
          tips={aiTips}
          onDismiss={(i) => setAiTips((prev) => prev.filter((_, idx) => idx !== i))}
        />
      )}

      <CVSections data={data} editable onUpdate={setData} />
    </div>
  );
}
