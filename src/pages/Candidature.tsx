import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "@phosphor-icons/react";

export default function Candidature() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-20">
      <Briefcase size={48} className="text-muted-foreground" />
      <h1 className="font-display text-2xl font-bold">Candidature</h1>
      <p className="text-center text-muted-foreground">
        Le tue candidature appariranno qui una volta create.
      </p>
    </div>
  );
}
