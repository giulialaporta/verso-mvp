import versoIcon from "@/assets/verso-icon.png";
import { Download } from "lucide-react";

export default function Icon() {
  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background for JPG
    ctx.fillStyle = "#0C0D10";
    ctx.fillRect(0, 0, 1024, 1024);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const link = document.createElement("a");
      link.download = "verso-icon.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
    img.src = versoIcon;
  };

  return (
    <div className="fixed inset-0 bg-[#0F1117] flex flex-col items-center justify-center gap-8">
      <img src={versoIcon} alt="Verso Icon" className="w-64 h-64 rounded-3xl shadow-2xl" style={{ background: "#0C0D10" }} />
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 bg-[#6EBF47] text-[#0F1117] font-bold text-lg px-8 py-3 rounded-full hover:brightness-110 transition-all"
      >
        <Download size={20} />
        Scarica JPG
      </button>
    </div>
  );
}
