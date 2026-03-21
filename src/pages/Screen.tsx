import { Download } from "lucide-react";

const SCREENS = [
  { src: "/screens/dashboard.png", label: "Dashboard", file: "verso-dashboard.jpg" },
  { src: "/screens/candidature.png", label: "Candidature", file: "verso-candidature.jpg" },
  { src: "/screens/detail.png", label: "Dettaglio candidatura", file: "verso-dettaglio.jpg" },
  { src: "/screens/wizard.png", label: "Nuova candidatura", file: "verso-wizard.jpg" },
  { src: "/screens/impostazioni.png", label: "Impostazioni", file: "verso-impostazioni.jpg" },
  { src: "/screens/landing.png", label: "Landing page", file: "verso-landing.jpg" },
];

function downloadAsJpg(src: string, filename: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.fillStyle = "#0F1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
  };
  img.src = src;
}

export default function Screen() {
  return (
    <div className="min-h-screen bg-[#0F1117] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[clamp(28px,4vw,48px)] font-bold text-[#F2F3F7] text-center mb-2">
          Schermate di Verso
        </h1>
        <p className="text-[#8B8FA8] text-center mb-10">Clicca su una card per scaricarla come JPG</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCREENS.map((s) => (
            <button
              key={s.file}
              onClick={() => downloadAsJpg(s.src, s.file)}
              className="group border border-[#2A2D35] rounded-2xl overflow-hidden bg-[#141518] hover:border-[#6EBF47]/50 transition-all text-left"
            >
              <img
                src={s.src}
                alt={s.label}
                className="w-full aspect-video object-cover object-top"
                loading="lazy"
              />
              <div className="p-4 flex items-center justify-between">
                <span className="text-[#F2F3F7] font-semibold">{s.label}</span>
                <span className="text-[#6EBF47] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={18} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
