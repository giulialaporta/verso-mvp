import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PaperPlaneTilt, Clock, Plus, Crown } from "@phosphor-icons/react";
import { useSubscription } from "@/hooks/useSubscription";
import { useProGate } from "@/hooks/useProGate";
import { VersoScoreLarge } from "@/components/VersoScore";
import type { JobData } from "./wizard-types";

export function StepCompleta({
  jobData,
  applicationId,
  matchScore,
  atsScore,
  honestScore,
  onMarkSent,
  onKeepDraft,
  onNewApplication,
}: {
  jobData: JobData;
  applicationId: string;
  matchScore: number | null;
  atsScore: number | null;
  honestScore: number | null;
  onMarkSent: () => void;
  onKeepDraft: () => void;
  onNewApplication: () => void;
}) {
  const { isPro } = useSubscription();
  const checkCanCreate = useProGate();

  const showFreeBanner = !isPro;

  const handleNewApp = async () => {
    const canCreate = await checkCanCreate(isPro);
    if (canCreate) onNewApplication();
  };

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-8 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <h2 className="font-display text-2xl font-bold mb-1">CV pronto!</h2>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{jobData.role_title}</span> presso <span className="text-foreground font-medium">{jobData.company_name}</span>
        </p>
      </motion.div>

      {/* Verso Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <VersoScoreLarge
          matchScore={matchScore}
          atsScore={atsScore}
          honestScore={honestScore}
        />
      </motion.div>

      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button onClick={onMarkSent} className="w-full gap-2 h-12">
            <PaperPlaneTilt size={18} /> Ho inviato la candidatura
          </Button>
          <p className="text-[11px] text-muted-foreground mt-1">Segna come inviata e vai alle candidature</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Button variant="outline" onClick={onKeepDraft} className="w-full gap-2">
            <Clock size={16} /> La invierò dopo
          </Button>
          <p className="text-[11px] text-muted-foreground mt-1">Resta come bozza, torna alla home</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Button variant="ghost" onClick={handleNewApp} className="w-full gap-2 text-muted-foreground">
            <Plus size={16} /> Nuova candidatura
          </Button>
        </motion.div>
      </div>

      {showFreeBanner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground pt-2"
        >
          <Crown size={14} className="text-warning" />
          <span>Hai usato la tua candidatura gratuita. La prossima volta, Verso Pro.</span>
        </motion.div>
      )}
    </div>
  );
}
