import { useState, useEffect, useRef } from "react";
import type { TailorResult } from "./wizard-types";

export const PROBLEMATIC_DOMAINS = [
  { pattern: "glassdoor.com", hint: "Glassdoor richiede login e potrebbe bloccare lo scraping." },
  { pattern: "ashbyhq.com", hint: "Ashby usa pagine dinamiche che bloccano lo scraping." },
  { pattern: "lever.co", hint: "Lever potrebbe bloccare le richieste automatiche." },
  { pattern: "greenhouse.io", hint: "Greenhouse usa pagine dinamiche difficili da leggere." },
];

export function getDomainHint(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const match = PROBLEMATIC_DOMAINS.find((d) => hostname.includes(d.pattern));
    if (match) return `${match.hint} Prova a copiare il testo.`;
  } catch { /* invalid URL */ }
  return null;
}

export function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef<number | null>(null);
  useEffect(() => {
    if (target <= 0) return;
    if (prevTargetRef.current === target) return;
    prevTargetRef.current = target;
    setValue(0);
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

export function applyPatchesFrontend(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(original));
  for (const patch of patches) {
    const { path, value } = patch;
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) target = target[idx];
      else {
        if (target[seg] === undefined || target[seg] === null) {
          const nextSeg = segments[i + 1];
          target[seg] = !isNaN(Number(nextSeg)) ? [] : {};
        }
        target = target[seg];
      }
      if (target === undefined || target === null) break;
    }
    if (target === undefined || target === null) continue;
    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) target[lastIdx] = value;
    else target[lastSeg] = value;
  }
  return result;
}

/** Deterministic confidence calculation from CV comparison */
export function computeConfidence(
  original: Record<string, unknown> | null,
  tailored: Record<string, unknown>,
  diff: TailorResult["diff"]
): { confidence: number; bulletsRewritten: number; bulletsAdded: number; sectionsRemoved: number; experiencesKept: number; experiencesOriginal: number } {
  const origExp = Array.isArray((original as any)?.experience) ? (original as any).experience : [];
  const tailExp = Array.isArray((tailored as any)?.experience) ? (tailored as any).experience : [];

  const experiencesOriginal = origExp.length;
  const experiencesKept = tailExp.length;
  const sectionsRemoved = Math.max(0, experiencesOriginal - experiencesKept);

  const bulletDiffs = diff.filter(d => d.section?.toLowerCase().includes("experience") || d.section?.toLowerCase().includes("esperienza"));
  const bulletsRewritten = bulletDiffs.length;

  let bulletsAdded = 0;
  tailExp.forEach((exp: any, i: number) => {
    const origBulletsArr = Array.isArray(origExp[i]?.bullets) ? origExp[i].bullets : [];
    const tailBulletsArr = Array.isArray(exp?.bullets) ? exp.bullets : [];
    const origBullets = origBulletsArr.length;
    const tailBullets = tailBulletsArr.length;
    if (tailBullets > origBullets) bulletsAdded += tailBullets - origBullets;
  });

  let confidence = 100;
  confidence -= sectionsRemoved * 8;
  confidence -= bulletsRewritten * 2;
  confidence -= bulletsAdded * 5;
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  return { confidence, bulletsRewritten, bulletsAdded, sectionsRemoved, experiencesKept, experiencesOriginal };
}

export const ATS_LABELS_IT: Record<string, string> = {
  keywords: "Parole chiave", format: "Formato", dates: "Date",
  measurable: "Risultati misurabili", cliches: "Frasi fatte",
  sections: "Sezioni standard", action_verbs: "Verbi d'azione",
};
