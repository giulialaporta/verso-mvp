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
  Briefcase,
  GraduationCap,
  User,
  Certificate,
  Lightbulb,
  Translate,
} from "@phosphor-icons/react";

type ParsedCV = {
  personal: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string };
  summary?: string;
  experience?: { title: string; company: string; period: string; description: string }[];
  education?: { degree: string; institution: string; period: string }[];
  skills?: string[];
  certifications?: { name: string; year: string }[];
  projects?: { name: string; description: string }[];
  languages?: { language: string; level: string }[];
};

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
      // Upload to storage
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(path, file, { contentType: "application/pdf" });

      if (uploadError) throw new Error("Errore durante il caricamento: " + uploadError.message);

      setFilePath(path);

      // Call parse-cv edge function
      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { filePath: path },
      });

      if (error) throw new Error(error.message || "Errore durante l'analisi");
      if (data?.error) throw new Error(data.error);

      setParsedData(data.parsed_data);
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
      });

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
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            VERS<span className="text-primary">O</span>
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP: UPLOAD */}
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

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
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
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FileArrowUp
                      size={48}
                      weight="duotone"
                      className={dragOver ? "text-primary" : "text-muted-foreground"}
                    />
                    <p className="text-sm text-muted-foreground">
                      Trascina il tuo CV qui o <span className="text-primary underline">sfoglia</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60">Solo PDF, max 10 MB</p>
                  </div>

                  {/* Selected file */}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleUploadAndParse}
                    disabled={!file}
                    className="w-full gap-2"
                  >
                    Analizza CV <ArrowRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP: PARSING */}
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
                    <p className="text-sm text-muted-foreground">
                      Stiamo estraendo le informazioni dal tuo documento.
                    </p>
                  </div>
                  <Progress value={undefined} className="h-1" />

                  {/* Skeleton sections */}
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

          {/* STEP: PREVIEW */}
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
                    <p className="text-sm text-muted-foreground">
                      Ecco cosa abbiamo estratto. Verifica che sia corretto.
                    </p>
                  </div>

                  {/* Personal */}
                  {parsedData.personal?.name && (
                    <Section icon={User} title="Dati personali">
                      <p className="font-medium">{parsedData.personal.name}</p>
                      {parsedData.personal.email && (
                        <p className="text-sm text-muted-foreground">{parsedData.personal.email}</p>
                      )}
                      {parsedData.personal.phone && (
                        <p className="text-sm text-muted-foreground">{parsedData.personal.phone}</p>
                      )}
                      {parsedData.personal.location && (
                        <p className="text-sm text-muted-foreground">{parsedData.personal.location}</p>
                      )}
                    </Section>
                  )}

                  {/* Summary */}
                  {parsedData.summary && (
                    <Section icon={User} title="Sommario">
                      <p className="text-sm text-foreground/80">{parsedData.summary}</p>
                    </Section>
                  )}

                  {/* Experience */}
                  {parsedData.experience && parsedData.experience.length > 0 && (
                    <Section icon={Briefcase} title="Esperienza">
                      {parsedData.experience.map((exp, i) => (
                        <div key={i} className="border-l-2 border-primary/30 pl-3 mb-3 last:mb-0">
                          <p className="font-medium text-sm">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.company} · {exp.period}
                          </p>
                          {exp.description && (
                            <p className="text-xs text-foreground/70 mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </Section>
                  )}

                  {/* Education */}
                  {parsedData.education && parsedData.education.length > 0 && (
                    <Section icon={GraduationCap} title="Formazione">
                      {parsedData.education.map((edu, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                          <p className="font-medium text-sm">{edu.degree}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.institution} · {edu.period}
                          </p>
                        </div>
                      ))}
                    </Section>
                  )}

                  {/* Skills */}
                  {parsedData.skills && parsedData.skills.length > 0 && (
                    <Section icon={Lightbulb} title="Competenze">
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Certifications */}
                  {parsedData.certifications && parsedData.certifications.length > 0 && (
                    <Section icon={Certificate} title="Certificazioni">
                      {parsedData.certifications.map((cert, i) => (
                        <p key={i} className="text-sm">
                          {cert.name} {cert.year && <span className="text-muted-foreground">({cert.year})</span>}
                        </p>
                      ))}
                    </Section>
                  )}

                  {/* Languages */}
                  {parsedData.languages && parsedData.languages.length > 0 && (
                    <Section icon={Translate} title="Lingue">
                      <div className="flex flex-wrap gap-2">
                        {parsedData.languages.map((lang, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
                          >
                            {lang.language} — {lang.level}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Honesty note */}
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

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={16} />
        <h3 className="font-mono text-xs uppercase tracking-wider">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
