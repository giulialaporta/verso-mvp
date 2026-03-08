import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash, User, Warning } from "@phosphor-icons/react";

export default function Impostazioni() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "ELIMINA") return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      await signOut();
      navigate("/login", { replace: true });
      toast({ title: "Account eliminato", description: "Tutti i tuoi dati sono stati rimossi." });
    } catch (err) {
      console.error(err);
      toast({ title: "Errore", description: "Non è stato possibile eliminare l'account. Riprova.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">Impostazioni</h1>

      {/* Account info */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User size={20} weight="bold" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Warning size={20} weight="bold" />
            Zona pericolosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Eliminando il tuo account, tutti i tuoi dati verranno cancellati permanentemente: CV, candidature, dati personali. Questa azione è irreversibile.
          </p>
          <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setConfirmText(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash size={18} className="mr-2" />
                Elimina account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tutti i tuoi dati verranno eliminati permanentemente: CV caricati, CV adattati, candidature, profilo. Non potrai recuperarli.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Digita <span className="font-mono font-bold text-foreground">ELIMINA</span> per confermare
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="ELIMINA"
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmText !== "ELIMINA" || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Eliminazione..." : "Elimina definitivamente"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
