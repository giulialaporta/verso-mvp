import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileArrowUp,
  FileText,
  X,
  Check,
  ArrowRight,
} from "@phosphor-icons/react";
import { CVSections } from "@/components/CVSections";
import type { ParsedCV } from "@/types/cv";

type Step = "upload" | "parsing" | "preview";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
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
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <h2 className="font-display text-2xl font-bold">Carica il tuo CV</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Carica un PDF e Verso estrarrà automaticamente le informazioni.
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
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FileArrowUp size={48} weight="duotone" className={dragOver ? "text-primary" : "text-muted-foreground"} />
                    <p className="text-sm text-muted-foreground">
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
                      <FileText size={24} className="text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
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
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <h2 className="font-display text-xl font-bold">Verso sta leggendo il tuo CV...</h2>
                    <p className="text-sm text-muted-foreground">Stiamo estraendo le informazioni dal tuo documento.</p>
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
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                      <Check size={24} className="text-primary" weight="bold" />
                    </div>
                    <h2 className="font-display text-xl font-bold">CV analizzato</h2>
                    <p className="text-sm text-muted-foreground">Ecco cosa abbiamo estratto. Verifica che sia corretto.</p>
                  </div>

                  <CVSections data={parsedData} />

                  <p className="text-center text-xs text-muted-foreground/60 italic">
                    Verso conosce solo quello che hai scritto nel tuo CV. Nessuna informazione inventata.
                  </p>

                  <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                    {saving ? "Salvataggio..." : "Tutto corretto, continua"}
                    <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
