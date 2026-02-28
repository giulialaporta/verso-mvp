import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "@phosphor-icons/react";

export default function Nuova() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-20">
      <Wrench size={48} className="text-muted-foreground" />
      <h1 className="font-display text-2xl font-bold">In costruzione</h1>
      <p className="text-center text-muted-foreground">
        La creazione di nuove candidature sarà disponibile a breve.
      </p>
    </div>
  );
}
