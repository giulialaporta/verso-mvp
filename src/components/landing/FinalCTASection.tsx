import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(168,255,120,0.06) 0%, transparent 70%)",
      }} />

      <div className="container relative z-10 text-center">
        <h2 className="font-display font-extrabold text-[32px] sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-4 sm:mb-6 max-w-3xl mx-auto">
          Smetti di mandare{" "}
          <span className="text-gradient">CV generici.</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-10 max-w-lg mx-auto">
          Il tuo prossimo colloquio parte da un CV che parla davvero di te.
        </p>
        <Button
          size="lg"
          className="font-bold text-sm sm:text-base px-8 sm:px-10 h-12 sm:h-14 rounded-full glow-accent hover:glow-accent-hover transition-shadow active:scale-[0.98]"
          onClick={() => navigate("/login?plan=free")}
        >
          Inizia gratis — è subito
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-4">
          Nessuna carta di credito · Setup in 3 minuti
        </p>
      </div>
    </section>
  );
};

export default FinalCTASection;
