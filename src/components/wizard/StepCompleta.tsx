import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, PaperPlaneTilt, Clock, Plus } from "@phosphor-icons/react";
import type { JobData } from "./wizard-types";

export function StepCompleta({
  jobData,
  applicationId,
  onMarkSent,
  onKeepDraft,
  onNewApplication,
}: {
  jobData: JobData;
  applicationId: string;
  onMarkSent: () => void;
  onKeepDraft: () => void;
  onNewApplication: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-8 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-primary" weight="fill" />
        </div>
        <h2 className="font-display text-2xl font-bold">CV pronto!</h2>
        <p className="text-muted-foreground mt-2">
          Il tuo CV per <span className="text-foreground font-medium">{jobData.role_title}</span> presso <span className="text-foreground font-medium">{jobData.company_name}</span> è stato preparato.
        </p>
      </motion.div>

      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={onMarkSent} className="w-full gap-2 h-12">
            <PaperPlaneTilt size={18} /> Ho inviato la candidatura
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">Segna come inviata e vai alle candidature</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button variant="outline" onClick={onKeepDraft} className="w-full gap-2">
            <Clock size={16} /> La invierò dopo
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">Resta come bozza, torna alla home</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button variant="ghost" onClick={onNewApplication} className="w-full gap-2 text-muted-foreground">
            <Plus size={16} /> Nuova candidatura
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
