const LinkedInCard = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div
        className="relative overflow-hidden"
        style={{
          width: 1200,
          height: 627,
          background: "#0C0D10",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Green glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 600,
            height: 400,
            top: "10%",
            left: "25%",
            background: "radial-gradient(ellipse, rgba(168,255,120,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Blue glow bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400,
            height: 300,
            bottom: 0,
            right: 0,
            background: "radial-gradient(ellipse, rgba(93,187,255,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex h-full">
          {/* Left side — branding */}
          <div className="flex flex-col justify-center pl-16 pr-8" style={{ width: "55%" }}>
            {/* Logo - Brand aligned */}
            <div className="mb-8 flex items-center">
              <span
                className="font-display font-extrabold tracking-[0.08em]"
                style={{ fontSize: 48, color: "#F2F3F7" }}
              >
                VERS
              </span>
              {/* Chevron pointing right-up replacing O */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: "rotate(-45deg)",
                  marginLeft: "-4px",
                  marginTop: "-4px",
                }}
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#A8FF78"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Claim */}
            <h1
              className="font-display font-bold leading-[1.1] mb-6"
              style={{ fontSize: 42, color: "#F2F3F7", letterSpacing: "-0.02em" }}
            >
              Il tuo CV,
              <br />
              alla sua{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #A8FF78 0%, #5DBBFF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                versione migliore.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="font-mono mb-10"
              style={{ fontSize: 14, color: "#8B8FA8", letterSpacing: "0.05em" }}
            >
              AI-POWERED CV TAILORING
            </p>

            {/* CTA mock */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium"
              style={{
                background: "#A8FF78",
                color: "#0C0D10",
                fontSize: 15,
                width: "fit-content",
              }}
            >
              Inizia gratis →
            </div>

            {/* URL */}
            <p className="font-mono mt-auto mb-6" style={{ fontSize: 12, color: "#4E5263" }}>
              verso-cv.lovable.app
            </p>
          </div>

          {/* Right side — mockup card */}
          <div className="flex items-center justify-center" style={{ width: "45%" }}>
            <div
              className="rounded-2xl"
              style={{
                width: 380,
                padding: "28px",
                background: "#141518",
                border: "1px solid #2A2D35",
                boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,255,120,0.1)",
              }}
            >
              {/* Score header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: "0.1em", color: "#8B8FA8" }}
                >
                  Compatibilità
                </span>
                <span className="font-mono font-bold" style={{ fontSize: 40, color: "#A8FF78" }}>
                  78%
                </span>
              </div>

              {/* Score bar */}
              <div
                className="rounded-full overflow-hidden mb-6"
                style={{ height: 10, background: "#1E2025" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "78%",
                    background: "linear-gradient(90deg, #FF6B6B 0%, #FFD166 50%, #A8FF78 100%)",
                  }}
                />
              </div>

              {/* Skills */}
              {[
                { skill: "Product Strategy", match: true },
                { skill: "Stakeholder Mgmt", match: true },
                { skill: "SQL", match: false },
              ].map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between rounded-lg px-4 mb-2"
                  style={{ background: "#1E2025", padding: "10px 16px" }}
                >
                  <span className="font-mono" style={{ fontSize: 12, color: "#F2F3F7" }}>
                    {item.skill}
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 12,
                      color: item.match ? "#A8FF78" : "#FFD166",
                    }}
                  >
                    {item.match ? "✓ Match" : "⚠ Gap"}
                  </span>
                </div>
              ))}

              {/* Generate button mock */}
              <div
                className="flex items-center justify-center rounded-xl mt-4 font-bold"
                style={{
                  height: 44,
                  background: "#A8FF78",
                  color: "#0C0D10",
                  fontSize: 14,
                }}
              >
                Genera CV ottimizzato →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInCard;