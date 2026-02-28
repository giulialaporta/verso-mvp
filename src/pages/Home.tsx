import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, UploadSimple } from "@phosphor-icons/react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasCV, setHasCV] = useState<boolean | null>(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: profile }, { data: cvs }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        supabase.from("master_cvs").select("id").eq("user_id", user.id).limit(1),
      ]);
      setProfileName(profile?.full_name || "");
      setHasCV(!!cvs && cvs.length > 0);
    };

    fetchData();
  }, [user]);

  const firstName = profileName?.split(" ")[0] || "utente";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Ciao, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {hasCV === null
            ? "Caricamento..."
            : hasCV
              ? "Sei pronto per la tua prima candidatura."
              : "Inizia caricando il tuo CV per personalizzare le candidature."}
        </p>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          {hasCV ? (
            <>
              <p className="text-center text-foreground">
                Il tuo CV è stato caricato. Ora puoi creare una candidatura su misura.
              </p>
              <Button onClick={() => navigate("/app/nuova")} className="gap-2">
                Nuova candidatura <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <UploadSimple size={40} className="text-primary" />
              <p className="text-center text-foreground">
                Carica il tuo CV per permettere a Verso di adattarlo alle offerte di lavoro.
              </p>
              <Button onClick={() => navigate("/onboarding")} className="gap-2">
                Carica il tuo CV <ArrowRight size={16} />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
