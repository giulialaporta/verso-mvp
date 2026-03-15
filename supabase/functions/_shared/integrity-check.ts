/**
 * Post-patch integrity check: validates tailored CV against original.
 * Reverts unauthorized changes to immutable fields and detects fabricated metrics.
 * Returns warnings and a server-computed honesty score.
 */

type Experience = {
  role?: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  description?: string;
  bullets?: string[];
};

type Education = {
  institution?: string;
  degree?: string;
  field?: string;
  start?: string;
  end?: string;
  grade?: string;
  honors?: string;
  program?: string;
  publication?: string;
};

type Certification = {
  name?: string;
  issuer?: string;
  year?: string;
};

type IntegrityResult = {
  warnings: string[];
  reverts: {
    immutable_fields_reverted: number;
    bullets_reverted: number;
    certifications_removed: number;
    certifications_restored: number;
  };
  computed_honesty: {
    dates_modified: number;
    roles_changed: number;
    companies_changed: number;
    degrees_changed: number;
    metrics_fabricated: number;
    certs_invented: number;
    certs_removed: number;
  };
};

// Patterns that indicate quantitative claims
const METRIC_PATTERNS = [
  /\d+\s*%/,                         // 35%, 18 %
  /[€$£]\s*[\d,.]+[KMB]?/i,          // €1.2M, $500K
  /[\d,.]+\s*[€$£]/,                  // 1.2M€
  /\d+[KMB]\+?\s*(users?|clienti|customers?|utenti)/i,  // 200K+ users
  /team\s*(of|di)\s*\d+/i,            // team of 8
  /\d+[\s-]person/i,                  // 15-person
  /hired?\s*\d+/i,                    // hired 4
  /\+\d+\s*%/,                        // +12%
  /\d+\+\s*(anni|years?|mesi|months?)/i, // 10+ anni
];

// Qualitative claim patterns that signal invented outcomes
const QUALITATIVE_CLAIM_PATTERNS = [
  /risultat[io]\s+(eccellent|misurabili|significativ|straordinari|ottim)/i,
  /migliorand[eo]\s+(significativamente|notevolmente|drasticamente|sensibilmente)/i,
  /ottimizzand[eo]\s+(i\s+processi|le\s+performance|l['']efficienza)/i,
  /leading\s+to\s+(significant|measurable|substantial)/i,
  /resulting\s+in\s+(improved|increased|decreased|reduced)/i,
  /achieving\s+(significant|outstanding|exceptional)/i,
  /con\s+successo\b/i,
  /with\s+outstanding\s+results/i,
  /driving\s+(significant|substantial)\s+(growth|improvement|results)/i,
  /contribu[a-z]+\s+(significativamente|in\s+modo\s+determinante)/i,
];

function extractMetrics(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const pattern of METRIC_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    if (matches) found.push(...matches);
  }
  return found;
}

function normalizeStr(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function stringsMatch(a: unknown, b: unknown): boolean {
  return normalizeStr(a) === normalizeStr(b);
}

/**
 * Check integrity of tailored CV against original.
 * MUTATES tailoredCV in place to revert unauthorized changes.
 */
export function checkIntegrity(
  originalCV: Record<string, unknown>,
  tailoredCV: Record<string, unknown>
): IntegrityResult {
  const warnings: string[] = [];
  const reverts = {
    immutable_fields_reverted: 0,
    bullets_reverted: 0,
    certifications_removed: 0,
    certifications_restored: 0,
  };
  const honesty = {
    dates_modified: 0,
    roles_changed: 0,
    companies_changed: 0,
    degrees_changed: 0,
    metrics_fabricated: 0,
    certs_invented: 0,
    certs_removed: 0,
  };

  // --- 1. Experience immutable fields ---
  const origExp = Array.isArray((originalCV as any)?.experience)
    ? (originalCV as any).experience as Experience[]
    : [];
  const tailExp = Array.isArray((tailoredCV as any)?.experience)
    ? (tailoredCV as any).experience as Experience[]
    : [];

  // Build a lookup from original experiences by company+role for fuzzy matching
  for (let i = 0; i < tailExp.length; i++) {
    const tExp = tailExp[i];
    // Try to find matching original experience
    const origMatch = findMatchingExperience(tExp, origExp);
    if (!origMatch) continue;

    // Check and revert immutable fields
    const immutableFields: (keyof Experience)[] = ["role", "company", "location", "start", "end"];
    for (const field of immutableFields) {
      if (origMatch[field] !== undefined && !stringsMatch(tExp[field], origMatch[field])) {
        const category = field === "start" || field === "end" ? "dates_modified"
          : field === "role" ? "roles_changed"
          : field === "company" ? "companies_changed"
          : null;

        warnings.push(
          `Experience[${i}].${field}: "${tExp[field]}" reverted to "${origMatch[field]}"`
        );
        (tExp as any)[field] = origMatch[field];
        reverts.immutable_fields_reverted++;
        if (category) (honesty as any)[category]++;
      }
    }

    // --- 2. Fabricated metrics in bullets ---
    const origBullets = Array.isArray(origMatch.bullets) ? origMatch.bullets : [];
    const tailBullets = Array.isArray(tExp.bullets) ? tExp.bullets : [];
    const origBulletsJoined = origBullets.join(" ") + " " + (origMatch.description || "");

    for (let b = 0; b < tailBullets.length; b++) {
      const bullet = tailBullets[b];
      if (typeof bullet !== "string") continue;

      const metricsInBullet = extractMetrics(bullet);
      if (metricsInBullet.length === 0) continue;

      // Check if each metric existed in the original experience text
      const fabricated = metricsInBullet.filter(
        metric => !origBulletsJoined.includes(metric)
      );

      if (fabricated.length > 0) {
        // Find closest original bullet or revert to original
        const origBullet = origBullets[b];
        if (origBullet) {
          warnings.push(
            `Experience[${i}].bullets[${b}]: fabricated metrics ${JSON.stringify(fabricated)}, reverted to original`
          );
          tailBullets[b] = origBullet;
          reverts.bullets_reverted++;
          honesty.metrics_fabricated += fabricated.length;
        }
      }
    }

    // Also check description for fabricated metrics
    if (tExp.description && typeof tExp.description === "string") {
      const descMetrics = extractMetrics(tExp.description);
      const origDescText = (origMatch.description || "") + " " + origBullets.join(" ");
      const fabricatedDesc = descMetrics.filter(m => !origDescText.includes(m));
      if (fabricatedDesc.length > 0 && origMatch.description) {
        warnings.push(
          `Experience[${i}].description: fabricated metrics ${JSON.stringify(fabricatedDesc)}, reverted`
        );
        (tExp as any).description = origMatch.description;
        reverts.bullets_reverted++;
        honesty.metrics_fabricated += fabricatedDesc.length;
      }
    }
  }

  // --- 3. Education immutable fields ---
  const origEdu = Array.isArray((originalCV as any)?.education)
    ? (originalCV as any).education as Education[]
    : [];
  const tailEdu = Array.isArray((tailoredCV as any)?.education)
    ? (tailoredCV as any).education as Education[]
    : [];

  for (let i = 0; i < tailEdu.length; i++) {
    const tEdu = tailEdu[i];
    const origMatch = findMatchingEducation(tEdu, origEdu);
    if (!origMatch) {
      // Education entry not found in original — might be invented
      // Check if it was in original at all
      const existsInOrig = origEdu.some(
        e => stringsMatch(e.institution, tEdu.institution) || stringsMatch(e.degree, tEdu.degree)
      );
      if (!existsInOrig && origEdu.length > 0) {
        warnings.push(`Education[${i}]: "${tEdu.degree} @ ${tEdu.institution}" not found in original, removing`);
        tailEdu.splice(i, 1);
        i--;
        honesty.degrees_changed++;
      }
      continue;
    }

    const eduImmutable: (keyof Education)[] = [
      "institution", "degree", "field", "grade", "honors", "program", "publication", "start", "end"
    ];
    for (const field of eduImmutable) {
      if (origMatch[field] !== undefined && !stringsMatch(tEdu[field], origMatch[field])) {
        warnings.push(
          `Education[${i}].${field}: "${tEdu[field]}" reverted to "${origMatch[field]}"`
        );
        (tEdu as any)[field] = origMatch[field];
        reverts.immutable_fields_reverted++;
        if (field === "degree" || field === "field" || field === "institution") {
          honesty.degrees_changed++;
        } else if (field === "start" || field === "end") {
          honesty.dates_modified++;
        }
      }
    }
  }

  // Restore removed education entries
  for (const origE of origEdu) {
    const stillExists = tailEdu.some(
      t => stringsMatch(t.institution, origE.institution) && stringsMatch(t.degree, origE.degree)
    );
    if (!stillExists) {
      warnings.push(`Education "${origE.degree} @ ${origE.institution}" was removed, restoring`);
      tailEdu.push(origE);
      reverts.immutable_fields_reverted++;
    }
  }

  // --- 4. Certifications: remove invented, restore removed ---
  const origCerts = Array.isArray((originalCV as any)?.certifications)
    ? (originalCV as any).certifications as Certification[]
    : [];
  const tailCerts = Array.isArray((tailoredCV as any)?.certifications)
    ? (tailoredCV as any).certifications as Certification[]
    : [];

  // Remove certifications not in original
  for (let i = tailCerts.length - 1; i >= 0; i--) {
    const tCert = tailCerts[i];
    const existsInOrig = origCerts.some(
      o => normalizeStr(o.name).includes(normalizeStr(tCert.name).substring(0, 10)) ||
           normalizeStr(tCert.name).includes(normalizeStr(o.name).substring(0, 10))
    );
    if (!existsInOrig && origCerts.length > 0) {
      warnings.push(`Certification "${tCert.name}" invented, removing`);
      tailCerts.splice(i, 1);
      reverts.certifications_removed++;
      honesty.certs_invented++;
    }
  }

  // Restore removed certifications
  for (const origC of origCerts) {
    const stillExists = tailCerts.some(
      t => normalizeStr(t.name).includes(normalizeStr(origC.name).substring(0, 10)) ||
           normalizeStr(origC.name).includes(normalizeStr(t.name).substring(0, 10))
    );
    if (!stillExists) {
      warnings.push(`Certification "${origC.name}" was removed, restoring`);
      tailCerts.push(origC);
      reverts.certifications_restored++;
      honesty.certs_removed++;
    }
  }

  // Update certifications array on tailored CV
  if (tailCerts.length > 0 || origCerts.length > 0) {
    (tailoredCV as any).certifications = tailCerts;
  }

  // --- 5. Personal data protection ---
  const origPersonal = (originalCV as any)?.personal;
  const tailPersonal = (tailoredCV as any)?.personal;
  if (origPersonal && tailPersonal) {
    const personalFields = ["name", "email", "phone", "location", "date_of_birth", "linkedin", "website"];
    for (const field of personalFields) {
      if (origPersonal[field] !== undefined && origPersonal[field] !== tailPersonal[field]) {
        warnings.push(`personal.${field} modified, reverting`);
        tailPersonal[field] = origPersonal[field];
        reverts.immutable_fields_reverted++;
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[integrity-check] ${warnings.length} issues found:`, warnings);
  }

  return { warnings, reverts, computed_honesty: honesty };
}

// --- Fuzzy matching helpers ---

function findMatchingExperience(target: Experience, originals: Experience[]): Experience | null {
  // Exact match on company
  const byCompany = originals.filter(o => stringsMatch(o.company, target.company));
  if (byCompany.length === 1) return byCompany[0];
  if (byCompany.length > 1) {
    // Further filter by role similarity
    const byRole = byCompany.find(o => stringsMatch(o.role, target.role));
    if (byRole) return byRole;
    return byCompany[0];
  }

  // Fuzzy: check if company name is contained
  const byPartialCompany = originals.filter(o =>
    normalizeStr(o.company).includes(normalizeStr(target.company).substring(0, 6)) ||
    normalizeStr(target.company).includes(normalizeStr(o.company).substring(0, 6))
  );
  if (byPartialCompany.length === 1) return byPartialCompany[0];
  if (byPartialCompany.length > 1) {
    const byRole = byPartialCompany.find(o =>
      normalizeStr(o.role).includes(normalizeStr(target.role).substring(0, 8)) ||
      normalizeStr(target.role).includes(normalizeStr(o.role).substring(0, 8))
    );
    return byRole || byPartialCompany[0];
  }

  // Match by index position as last resort (if dates match)
  return null;
}

function findMatchingEducation(target: Education, originals: Education[]): Education | null {
  // Match by institution
  const byInst = originals.filter(o =>
    stringsMatch(o.institution, target.institution) ||
    normalizeStr(o.institution).includes(normalizeStr(target.institution).substring(0, 8)) ||
    normalizeStr(target.institution).includes(normalizeStr(o.institution).substring(0, 8))
  );
  if (byInst.length === 1) return byInst[0];
  if (byInst.length > 1) {
    const byDegree = byInst.find(o => stringsMatch(o.degree, target.degree));
    return byDegree || byInst[0];
  }
  return null;
}
