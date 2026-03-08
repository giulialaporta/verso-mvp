import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SensitiveDataConsent, hasSensitiveDataConsent } from "@/components/SensitiveDataConsent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileArrowUp,
  FileText,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  CurrencyEur,
} from "@phosphor-icons/react";
import { CVSections } from "@/components/CVSections";
import { CVSuggestions } from "@/components/CVSuggestions";
import type { ParsedCV } from "@/types/cv";

type Step = "upload" | "parsing" | "preview" | "salary";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCV | null>(null);
  const [saving, setSaving] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  // Salary expectations
  const [currentRal, setCurrentRal] = useState<string>("");
  const [desiredRal, setDesiredRal] = useState<string>("");

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Solo file PDF sono accettati.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Il file deve essere più piccolo di 10 MB.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUploadAndParse = async () => {
    if (!file || !user) return;

    setStep("parsing");

    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(path, file, { contentType: "application/pdf" });

      if (uploadError) throw new Error("Errore durante il caricamento: " + uploadError.message);

      setFilePath(path);

      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { filePath: path },
      });

      if (error) throw new Error(error.message || "Errore durante l'analisi");
      if (data?.error) throw new Error(data.error);

      setParsedData(data.parsed_data);
      setPhotoUrl(data.photo_url || null);
      setRawText(data.raw_text || null);
      setStep("preview");
    } catch (e: any) {
      console.error("Parse error:", e);
      toast.error(e.message || "Errore durante l'analisi del CV. Riprova.");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (!parsedData || !user) return;
    setSaving(true);

    try {
      // Deactivate existing master CVs for this user before inserting new one
      await supabase.from("master_cvs").update({ is_active: false } as any).eq("user_id", user.id);

      const { error } = await supabase.from("master_cvs").insert({
        user_id: user.id,
        parsed_data: parsedData as any,
        file_name: file?.name || null,
        file_url: filePath || null,
        raw_text: rawText || null,
        source: "upload",
        photo_url: photoUrl || null,
      } as any);

      if (error) throw error;

      // Save salary expectations if provided
      const currentVal = currentRal ? parseInt(currentRal, 10) : null;
      const desiredVal = desiredRal ? parseInt(desiredRal, 10) : null;
      if (currentVal !== null || desiredVal !== null) {
        await supabase
          .from("profiles")
          .update({
            salary_expectations: {
              current_ral: currentVal,
              desired_ral: desiredVal,
            },
          } as any)
          .eq("user_id", user.id);
      }

      toast.success("CV salvato con successo!");
      navigate("/app/home");
    } catch (e: any) {
      toast.error(e.message || "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatRal = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("it-IT");
  };

  const handleRalInput = (
    value: string,
    setter: (v: string) => void
  ) => {
    const clean = value.replace(/\D/g, "");
    setter(clean);
  };

  return (
    <div className="flex min-h-[100dvh] items-start justify-center bg-background px-3 py-6 sm:px-4 sm:py-12 sm:items-center">
      <div className="w-full max-w-xl space-y-4 sm:space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            VERS<span className="text-primary">O</span>
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5 px-4 sm:pt-6 sm:px-6 space-y-5 sm:space-y-6">
                  <div className="text-center">
                    <h2 className="font-display text-xl sm:text-2xl font-bold">Carica il tuo CV</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Carica un PDF e Verso estrarrà le informazioni.
                    </p>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf";
                      input.onchange = (e) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        if (f) handleFile(f);
                      };
                      input.click();
                    }}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 sm:p-10 transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FileArrowUp size={40} weight="duotone" className={dragOver ? "text-primary" : "text-muted-foreground"} />
                    <p className="text-sm text-muted-foreground text-center">
                      Trascina il tuo CV qui o <span className="text-primary underline">sfoglia</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60">Solo PDF, max 10 MB</p>
                  </div>

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <FileText size={24} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X size={18} />
                      </button>
                    </motion.div>
                  )}

                  <Button onClick={handleUploadAndParse} disabled={!file} className="w-full gap-2">
                    Analizza CV <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "parsing" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5 px-4 sm:pt-6 sm:px-6 space-y-5 sm:space-y-6">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <h2 className="font-display text-lg sm:text-xl font-bold">Verso sta leggendo il tuo CV...</h2>
                    <p className="text-sm text-muted-foreground">Stiamo estraendo le informazioni.</p>
                  </div>
                  <Progress value={undefined} className="h-1" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <div className="h-4 w-24 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted/50" />
                        <div className="h-3 w-3/4 rounded bg-muted/50" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "preview" && parsedData && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5 px-3 sm:pt-6 sm:px-6 space-y-4 sm:space-y-6">
                   <div className="text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                      <Check size={20} className="text-primary" weight="bold" />
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold">CV analizzato</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Abbiamo trovato{" "}
                      {parsedData.experience?.length ?? 0} esperienze,{" "}
                      {[...(parsedData.skills?.technical ?? []), ...(parsedData.skills?.soft ?? []), ...(parsedData.skills?.tools ?? [])].length} competenze
                      {parsedData.certifications?.length ? `, ${parsedData.certifications.length} certificazioni` : ""}.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controlla che i dati siano corretti. Puoi modificare qualsiasi campo toccandolo.
                    </p>
                  </div>

                  <CVSections data={parsedData} editable onUpdate={setParsedData} />

                  <CVSuggestions data={parsedData} onUpdate={setParsedData} />

                  <p className="text-center text-[11px] text-muted-foreground/50 italic">
                    Verso conosce solo quello che hai scritto nel tuo CV. Nessuna informazione inventata.
                  </p>

                  <Button onClick={() => setStep("salary")} className="w-full gap-2">
                    Continua <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "salary" && (
            <motion.div
              key="salary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-5 pb-5 px-4 sm:pt-6 sm:px-6 space-y-5 sm:space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                      <CurrencyEur size={20} className="text-primary" weight="bold" />
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold">
                      Aspettative economiche
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Opzionale. Verso le userà per confrontare il range dell'offerta.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-ral" className="text-sm text-muted-foreground">
                        RAL attuale (€)
                      </Label>
                      <div className="relative">
                        <CurrencyEur
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                          id="current-ral"
                          placeholder="es. 45.000"
                          value={currentRal ? formatRal(currentRal) : ""}
                          onChange={(e) => handleRalInput(e.target.value, setCurrentRal)}
                          className="pl-9 font-mono"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desired-ral" className="text-sm text-muted-foreground">
                        RAL desiderata (€)
                      </Label>
                      <div className="relative">
                        <CurrencyEur
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                          id="desired-ral"
                          placeholder="es. 55.000"
                          value={desiredRal ? formatRal(desiredRal) : ""}
                          onChange={(e) => handleRalInput(e.target.value, setDesiredRal)}
                          className="pl-9 font-mono"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-muted-foreground/50 italic">
                    Questi dati restano privati e non vengono mai inseriti nel CV.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep("preview")}
                      className="gap-2"
                    >
                      <ArrowLeft size={16} /> Indietro
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 gap-2"
                    >
                      {saving ? "Salvataggio..." : "Salva e continua"}
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
