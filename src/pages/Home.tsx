import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRight, UploadSimple, Trash, FileText } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CVSections } from "@/components/CVSections";
import type { ParsedCV } from "@/types/cv";

type MasterCV = {
  id: string;
  parsed_data: ParsedCV | null;
  file_name: string | null;
  file_url: string | null;
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cv, setCv] = useState<MasterCV | null | undefined>(undefined); // undefined = loading
  const [profileName, setProfileName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: profile }, { data: cvs }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        supabase.from("master_cvs").select("*").eq("user_id", user.id).limit(1),
      ]);
      setProfileName(profile?.full_name || "");
      setCv(cvs && cvs.length > 0 ? (cvs[0] as unknown as MasterCV) : null);
    };

    fetchData();
  }, [user]);

  const handleDelete = async () => {
    if (!cv || !user) return;
    setDeleting(true);

    try {
      // Delete file from storage if exists
      if (cv.file_url) {
        await supabase.storage.from("cv-uploads").remove([cv.file_url]);
      }

      // Delete record
      const { error } = await supabase.from("master_cvs").delete().eq("id", cv.id);
      if (error) throw error;

      setCv(null);
      toast.success("CV eliminato con successo.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'eliminazione.");
    } finally {
      setDeleting(false);
    }
  };

  const firstName = profileName?.split(" ")[0] || "utente";
  const isLoading = cv === undefined;
  const hasCV = cv !== null && cv !== undefined;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Ciao, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Caricamento..."
            : hasCV
              ? "Il tuo CV è pronto."
              : "Inizia caricando il tuo CV per personalizzare le candidature."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? null : hasCV ? (
          <motion.div
            key="has-cv"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* CV Data Card */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="flex flex-col items-center gap-1 pb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <CardTitle className="text-lg">Il tuo CV</CardTitle>
                </div>
                {cv.file_name && (
                  <span className="font-mono text-sm text-muted-foreground text-center break-all">
                    {cv.file_name}
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {cv.parsed_data ? (
                  <CVSections data={cv.parsed_data} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nessun dato estratto disponibile.</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash size={16} /> Elimina CV
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare il CV?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Il tuo CV e tutti i dati estratti verranno eliminati permanentemente. Potrai caricarne uno nuovo in qualsiasi momento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? "Eliminazione..." : "Elimina"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button variant="outline" size="sm" onClick={() => navigate("/onboarding")} className="gap-2">
                    <UploadSimple size={16} /> Carica nuovo CV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-border/50 bg-card/80">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <p className="text-center text-foreground">
                  Sei pronto per creare una candidatura su misura.
                </p>
                <Button onClick={() => navigate("/app/nuova")} className="gap-2">
                  Nuova candidatura <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="no-cv"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-border/50 bg-card/80">
              <CardContent className="flex flex-col items-center gap-4 py-10">
                <UploadSimple size={40} className="text-primary" />
                <p className="text-center text-foreground">
                  Carica il tuo CV per permettere a Verso di adattarlo alle offerte di lavoro.
                </p>
                <Button onClick={() => navigate("/onboarding")} className="gap-2">
                  Carica il tuo CV <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
