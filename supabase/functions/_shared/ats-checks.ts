/**
 * Deterministic ATS checks — 11 checks run on the tailored CV JSON.
 * No AI needed. Pure logic.
 */

interface ATSCheck {
  check: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  suggestion?: string;
  weight: number;
}

interface ATSResult {
  checks: ATSCheck[];
  score: number;
}

// --- Helpers ---

function extractAllText(cv: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof (cv as any)?.summary === "string") parts.push((cv as any).summary);

  const exp = (cv as any)?.experience;
  if (Array.isArray(exp)) {
    for (const e of exp) {
      if (e.role) parts.push(e.role);
      if (e.company) parts.push(e.company);
      if (e.description) parts.push(e.description);
      if (Array.isArray(e.bullets)) parts.push(...e.bullets.filter((b: any) => typeof b === "string"));
    }
  }

  const edu = (cv as any)?.education;
  if (Array.isArray(edu)) {
    for (const e of edu) {
      if (e.degree) parts.push(e.degree);
      if (e.field) parts.push(e.field);
      if (e.institution) parts.push(e.institution);
    }
  }

  const skills = (cv as any)?.skills;
  if (skills && typeof skills === "object") {
    for (const key of ["technical", "soft", "tools"]) {
      if (Array.isArray(skills[key])) parts.push(...skills[key].filter((s: any) => typeof s === "string"));
    }
  }

  const certs = (cv as any)?.certifications;
  if (Array.isArray(certs)) {
    for (const c of certs) {
      if (c.name) parts.push(c.name);
      if (c.issuer) parts.push(c.issuer);
    }
  }

  const projects = (cv as any)?.projects;
  if (Array.isArray(projects)) {
    for (const p of projects) {
      if (p.name) parts.push(p.name);
      if (p.description) parts.push(p.description);
    }
  }

  return parts.join(" ");
}

function getAllDates(cv: Record<string, unknown>): string[] {
  const dates: string[] = [];
  const exp = (cv as any)?.experience;
  if (Array.isArray(exp)) {
    for (const e of exp) {
      if (e.start) dates.push(e.start);
      if (e.end) dates.push(e.end);
    }
  }
  const edu = (cv as any)?.education;
  if (Array.isArray(edu)) {
    for (const e of edu) {
      if (e.start) dates.push(e.start);
      if (e.end) dates.push(e.end);
    }
  }
  return dates.filter(d => typeof d === "string" && d.trim().length > 0);
}

// --- Individual checks ---

function checkSingleColumn(_cv: Record<string, unknown>): ATSCheck {
  // Verso generates JSON → always single column. Check for tab-based layouts in text.
  const allText = extractAllText(_cv);
  const hasTabLayout = /\t{2,}/.test(allText) || /\|.*\|.*\|/.test(allText);
  return {
    check: "single_column",
    label: "Layout singola colonna",
    status: hasTabLayout ? "warning" : "pass",
    detail: hasTabLayout
      ? "Rilevata possibile struttura a colonne nel testo"
      : "Struttura lineare rilevata",
    suggestion: hasTabLayout ? "Rimuovere tabulazioni multiple e strutture a colonne" : undefined,
    weight: 15,
  };
}

function checkNoTables(cv: Record<string, unknown>): ATSCheck {
  const allText = extractAllText(cv);
  const hasTablePattern = /\|[^|]+\|[^|]+\|/.test(allText) || /\t[^\t]+\t[^\t]+\t/.test(allText);
  return {
    check: "no_tables",
    label: "Nessuna tabella",
    status: hasTablePattern ? "warning" : "pass",
    detail: hasTablePattern
      ? "Rilevata possibile struttura tabulare"
      : "Nessuna struttura tabulare trovata",
    suggestion: hasTablePattern ? "Convertire le tabelle in elenchi puntati" : undefined,
    weight: 10,
  };
}

function checkContactsInBody(cv: Record<string, unknown>): ATSCheck {
  const personal = (cv as any)?.personal;
  const missing: string[] = [];
  if (!personal?.email?.trim()) missing.push("email");
  if (!personal?.phone?.trim()) missing.push("telefono");
  if (!personal?.location?.trim()) missing.push("luogo");

  return {
    check: "contacts_in_body",
    label: "Contatti nel corpo",
    status: missing.length === 0 ? "pass" : missing.length <= 1 ? "warning" : "fail",
    detail: missing.length === 0
      ? "Email, telefono e luogo presenti"
      : `Mancanti: ${missing.join(", ")}`,
    suggestion: missing.length > 0 ? "Aggiungere i contatti mancanti nel CV" : undefined,
    weight: 10,
  };
}

function checkStandardSections(cv: Record<string, unknown>): ATSCheck {
  const required = ["summary", "experience", "education", "skills"];
  const present = required.filter(s => {
    const val = (cv as any)?.[s];
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "object" && val !== null) return Object.keys(val).length > 0;
    return false;
  });
  const missing = required.filter(s => !present.includes(s));

  return {
    check: "standard_sections",
    label: "Sezioni standard presenti",
    status: missing.length === 0 ? "pass" : missing.length <= 1 ? "warning" : "fail",
    detail: missing.length === 0
      ? "Tutte le sezioni standard sono presenti"
      : `Sezioni mancanti: ${missing.join(", ")}`,
    suggestion: missing.length > 0 ? `Aggiungere le sezioni: ${missing.join(", ")}` : undefined,
    weight: 10,
  };
}

function checkNoSpecialChars(cv: Record<string, unknown>): ATSCheck {
  const allText = extractAllText(cv);
  const problems: string[] = [];

  if (/\u2014/.test(allText)) problems.push("em dash (\u2014)");
  if (/\u2013/.test(allText)) problems.push("en dash (\u2013)");
  if (/[\u201C\u201D\u2018\u2019]/.test(allText)) problems.push("virgolette tipografiche");
  // Check for emoji (supplementary Unicode planes)
  try {
    if (/[\u{1F300}-\u{1FFFF}]/u.test(allText)) problems.push("emoji");
  } catch { /* regex not supported */ }

  return {
    check: "no_special_chars",
    label: "Caratteri compatibili ATS",
    status: problems.length === 0 ? "pass" : "fail",
    detail: problems.length === 0
      ? "Nessun carattere problematico trovato"
      : `Trovati: ${problems.join(", ")}`,
    suggestion: problems.length > 0
      ? "Sostituire em dash e en dash con trattino (-), rimuovere emoji e virgolette tipografiche"
      : undefined,
    weight: 10,
  };
}

function checkDateFormat(cv: Record<string, unknown>): ATSCheck {
  const dates = getAllDates(cv);
  if (dates.length === 0) {
    return { check: "date_format", label: "Date consistenti", status: "warning", detail: "Nessuna data trovata nel CV", weight: 10 };
  }

  // Accept: MM/YYYY, YYYY, "Presente"/"Present"/"current", month abbreviations like "Gen 2020"
  const validPatterns = [
    /^\d{2}\/\d{4}$/,           // MM/YYYY
    /^\d{4}$/,                   // YYYY only
    /^(presente|present|current|attuale|oggi|today)$/i,
    /^[A-Za-zÀ-ú]{3,}\s+\d{4}$/,  // "Gen 2020", "Jan 2020"
    /^\d{4}-\d{2}(-\d{2})?$/,   // ISO: 2020-03 or 2020-03-15
  ];

  const invalid = dates.filter(d => !validPatterns.some(p => p.test(d.trim())));

  return {
    check: "date_format",
    label: "Date consistenti",
    status: invalid.length === 0 ? "pass" : invalid.length <= 2 ? "warning" : "fail",
    detail: invalid.length === 0
      ? "Tutte le date in formato riconoscibile"
      : `Date con formato non standard: ${invalid.slice(0, 3).join(", ")}`,
    suggestion: invalid.length > 0 ? "Uniformare tutte le date al formato MM/YYYY" : undefined,
    weight: 10,
  };
}

function checkAcronymsExpanded(cv: Record<string, unknown>): ATSCheck {
  const allText = extractAllText(cv);
  const commonAcronyms = ["AI", "ML", "RPA", "CRM", "ERP", "KPI", "ROI", "SLA", "API", "SaaS", "B2B", "B2C"];

  const unexpanded: string[] = [];
  for (const acr of commonAcronyms) {
    // Check if acronym appears in the text
    const regex = new RegExp(`\\b${acr}\\b`, "g");
    if (regex.test(allText)) {
      // Check if expanded form exists nearby (e.g., "Intelligenza Artificiale (AI)" or "AI - Artificial Intelligence")
      const expandedRegex = new RegExp(`[A-Za-zÀ-ú]+\\s+[A-Za-zÀ-ú]+\\s*\\(${acr}\\)`, "i");
      const expandedRegex2 = new RegExp(`${acr}\\s*[-–—]\\s*[A-Za-zÀ-ú]+\\s+[A-Za-zÀ-ú]+`, "i");
      if (!expandedRegex.test(allText) && !expandedRegex2.test(allText)) {
        unexpanded.push(acr);
      }
    }
  }

  return {
    check: "acronyms_expanded",
    label: "Acronimi espansi",
    status: unexpanded.length === 0 ? "pass" : unexpanded.length <= 2 ? "warning" : "fail",
    detail: unexpanded.length === 0
      ? "Tutti gli acronimi hanno forma estesa"
      : `Acronimi non espansi: ${unexpanded.join(", ")}`,
    suggestion: unexpanded.length > 0
      ? `Espandere alla prima occorrenza: ${unexpanded.map(a => `"${a}"`).join(", ")}`
      : undefined,
    weight: 5,
  };
}

function checkKeywordRate(cv: Record<string, unknown>, jdKeywords: string[]): ATSCheck {
  if (jdKeywords.length === 0) {
    return { check: "keyword_rate", label: "Keyword match rate", status: "pass", detail: "Nessuna keyword di riferimento", weight: 15 };
  }

  const cvText = extractAllText(cv).toLowerCase();
  const matched = jdKeywords.filter(kw => cvText.includes(kw.toLowerCase()));
  const percentage = Math.round((matched.length / jdKeywords.length) * 100);

  let status: "pass" | "warning" | "fail";
  let detail: string;
  let suggestion: string | undefined;

  if (percentage >= 65 && percentage <= 85) {
    status = "pass";
    detail = `${percentage}% match rate \u2014 nella fascia ottimale`;
  } else if (percentage < 65) {
    status = "warning";
    detail = `${percentage}% match rate \u2014 sotto il minimo consigliato (65%)`;
    suggestion = "Inserire nel testo le keyword mancanti in modo naturale";
  } else {
    status = "warning";
    detail = `${percentage}% match rate \u2014 sopra l'85%, possibile keyword stuffing`;
    suggestion = "Ridurre le ripetizioni di keyword, riscrivere in modo piu' naturale";
  }

  return { check: "keyword_rate", label: "Keyword match rate", status, detail, suggestion, weight: 15 };
}

function checkNoPhotos(cv: Record<string, unknown>): ATSCheck {
  const hasPhoto = !!(cv as any)?.photo_base64 || !!(cv as any)?.photo_url;
  return {
    check: "no_photos",
    label: "Nessuna foto nel CV ATS",
    status: hasPhoto ? "warning" : "pass",
    detail: hasPhoto ? "Foto presente nel CV" : "Foto assente",
    suggestion: hasPhoto ? "Rimuovere la foto per compatibilità ATS" : undefined,
    weight: 5,
  };
}

function checkBulletQuality(cv: Record<string, unknown>): ATSCheck {
  const exp = (cv as any)?.experience;
  if (!Array.isArray(exp)) {
    return { check: "bullet_quality", label: "Qualità bullet point", status: "pass", detail: "Nessuna esperienza da verificare", weight: 5 };
  }

  let totalBullets = 0;
  let emptyBullets = 0;
  let shortBullets = 0;

  for (const e of exp) {
    if (!Array.isArray(e.bullets)) continue;
    for (const b of e.bullets) {
      if (typeof b !== "string") continue;
      totalBullets++;
      const trimmed = b.trim();
      if (trimmed.length === 0 || /^[•\-…\.·\s]+$/.test(trimmed)) emptyBullets++;
      else if (trimmed.length < 15) shortBullets++;
    }
  }

  const problems = emptyBullets + shortBullets;
  return {
    check: "bullet_quality",
    label: "Qualità bullet point",
    status: problems === 0 ? "pass" : problems <= 2 ? "warning" : "fail",
    detail: problems === 0
      ? `${totalBullets} bullet point tutti con contenuto adeguato`
      : `${emptyBullets} vuoti, ${shortBullets} troppo corti su ${totalBullets} totali`,
    suggestion: problems > 0 ? "Riscrivere i bullet troppo corti con dettagli specifici" : undefined,
    weight: 5,
  };
}

function checkPlainTextOrder(cv: Record<string, unknown>): ATSCheck {
  const expectedOrder = ["personal", "summary", "experience", "education", "skills", "certifications", "projects"];
  const cvKeys = Object.keys(cv).filter(k => expectedOrder.includes(k));

  let inOrder = true;
  let lastIdx = -1;
  for (const key of cvKeys) {
    const idx = expectedOrder.indexOf(key);
    if (idx < lastIdx) { inOrder = false; break; }
    lastIdx = idx;
  }

  return {
    check: "plain_text_order",
    label: "Ordine sezioni corretto",
    status: inOrder ? "pass" : "warning",
    detail: inOrder
      ? "Sezioni in ordine standard"
      : "L'ordine delle sezioni non segue lo standard ATS",
    suggestion: inOrder ? undefined : "Riordinare: Profilo, Esperienze, Formazione, Competenze, Certificazioni",
    weight: 5,
  };
}

// --- Main entry ---

export function runATSChecks(cv: Record<string, unknown>, jdKeywords: string[]): ATSResult {
  const checks: ATSCheck[] = [
    checkSingleColumn(cv),
    checkNoTables(cv),
    checkContactsInBody(cv),
    checkStandardSections(cv),
    checkNoSpecialChars(cv),
    checkDateFormat(cv),
    checkAcronymsExpanded(cv),
    checkKeywordRate(cv, jdKeywords),
    checkNoPhotos(cv),
    checkBulletQuality(cv),
    checkPlainTextOrder(cv),
  ];

  const score = checks.reduce((acc, c) => {
    if (c.status === "pass") return acc + c.weight;
    if (c.status === "warning") return acc + Math.floor(c.weight / 2);
    return acc;
  }, 0);

  return { checks, score };
}
