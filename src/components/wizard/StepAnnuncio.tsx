import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Link as LinkIcon, TextAa, Buildings,
  Briefcase, XCircle, MagicWand, LinkedinLogo, Globe, Info, CaretDown,
} from "@phosphor-icons/react";
import { getDomainHint } from "./wizard-utils";
import type { JobData } from "./wizard-types";

export function StepAnnuncio({
  onConfirm,
  initialJobData,
}: {
  onConfirm: (data: JobData, jobUrl?: string, jobText?: string) => void;
  initialJobData?: JobData | null;
}) {
  const [tab, setTab] = useState<string>("text");
  const [guideOpen, setGuideOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState(initialJobData?.description || "");
  const [companyName, setCompanyName] = useState(initialJobData?.company_name || "");
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    toast.error("Il sito non risponde. Copia il testo dell'annuncio e usa il tab Testo.");
    setTab("text");
  }, []);

  const handleAnalyze = useCallback(async () => {
    // Company name is optional — will fallback to AI-extracted or "Azienda riservata"
    setLoading(true);
    setJobData(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = tab === "url" ? setTimeout(() => controller.abort(), 25000) : undefined;

    try {
      const body: Record<string, string> = {};
      if (tab === "url") {
        if (!url.trim()) { toast.error("Inserisci un URL"); setLoading(false); return; }
        body.url = url.trim();
      } else {
        if (text.trim().length < 30) { toast.error("Il testo è troppo corto"); setLoading(false); return; }
        body.text = text.trim();
      }
      const { data, error } = await supabase.functions.invoke("scrape-job", { body, signal: controller.signal as AbortSignal });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const merged = { ...data.job_data, company_name: companyName.trim() || data.job_data.company_name || "Azienda riservata" };
      setJobData(merged);
    } catch (e: unknown) {
      if (controller.signal.aborted) {
        toast.error("Il sito non risponde. Copia il testo dell'annuncio e usa il tab Testo.");
        setTab("text");
        return;
      }
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi";
      if (tab === "url") {
        const domainHint = getDomainHint(url);
        toast.error(domainHint || msg);
        setTab("text");
        toast.info("Prova a incollare il testo dell'annuncio direttamente.");
      } else {
        toast.error(msg);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [tab, url, text, companyName]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div>
        <h2 className="font-display text-2xl font-bold">L'annuncio</h2>
        <p className="text-muted-foreground mt-1">Incolla il link o il testo dell'offerta di lavoro.</p>
      </div>

      {!jobData ? (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Buildings size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Es. Google, Accenture, Intesa Sanpaolo..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} className="pl-9" />
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">Se l'annuncio è di un'agenzia e non conosci l'azienda, lascia vuoto.</p>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1 gap-2"><TextAa size={16} /> Testo</TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-2 text-xs"><LinkIcon size={16} /> URL <span className="text-[11px] text-muted-foreground hidden sm:inline">(solo alcuni siti)</span></TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-4 space-y-3">
                <Textarea placeholder="Incolla qui il testo completo dell'annuncio..." value={text} onChange={(e) => setText(e.target.value)} disabled={loading} rows={10} className="resize-none" />
                <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <Info size={14} /><span>Come copiare da LinkedIn, Indeed...</span>
                    <CaretDown size={12} className={`ml-auto transition-transform duration-200 ${guideOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mt-3 rounded-lg border border-border/50 bg-surface p-4 space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <LinkedinLogo size={16} className="text-info shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">LinkedIn</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Apri l'annuncio su LinkedIn</li><li>Seleziona tutto il testo (Ctrl+A / ⌘+A)</li><li>Copia (Ctrl+C / ⌘+C)</li><li>Incolla qui</li>
                          </ol>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe size={16} className="text-info shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">Indeed, InfoJobs, Monster, Glassdoor</p>
                          <p>Stesso metodo. Apri l'annuncio, seleziona il testo e incollalo qui.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 border-t border-border/30 pt-2">
                        <Info size={14} className="text-warning shrink-0 mt-0.5" />
                        <p><span className="text-foreground font-medium">Tip:</span> Puoi anche provare il tab URL incollando il link dell'annuncio. Se non funziona, il testo è sempre l'opzione più affidabile.</p>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
              <TabsContent value="url" className="mt-4">
                <Input placeholder="https://www.linkedin.com/jobs/view/..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
                <p className="text-[11px] text-muted-foreground mt-2">Se l'URL non funziona, copia il testo dell'annuncio e usa il tab Testo.</p>
              </TabsContent>
            </Tabs>
            {loading ? (
              <Button onClick={handleCancel} variant="destructive" className="w-full gap-2"><XCircle size={16} /> Annulla</Button>
            ) : (
              <Button onClick={handleAnalyze} className="w-full gap-2"><MagicWand size={16} /> Analizza</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Buildings size={24} className="text-info mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">{jobData.company_name}</h3>
                  {jobData.is_staffing_agency && (
                    <span className="inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-mono text-warning">Tramite agenzia</span>
                  )}
                  {jobData.end_client && (
                    <p className="text-xs text-muted-foreground">Per conto di: <span className="text-foreground font-medium">{jobData.end_client}</span></p>
                  )}
                  <p className="text-primary font-medium">{jobData.role_title}</p>
                  {jobData.location && <p className="text-sm text-muted-foreground">{jobData.location}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Requisiti chiave</p>
                <ul className="space-y-1">
                  {jobData.key_requirements.slice(0, 5).map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><Briefcase size={14} className="text-primary mt-0.5 shrink-0" /><span>{req}</span></li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.required_skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary">{skill}</span>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setJobData(null)} className="gap-2"><ArrowLeft size={16} /> Modifica</Button>
                <Button className="flex-1 gap-2" onClick={() => onConfirm(jobData, tab === "url" ? url : undefined, tab === "text" ? text : undefined)}>
                  Conferma e verifica <ArrowRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
