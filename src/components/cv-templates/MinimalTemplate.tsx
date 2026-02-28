import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: "#1a1a1a", paddingHorizontal: 62, paddingVertical: 48 },
  name: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  contact: { fontSize: 9, color: "#666", marginBottom: 4 },
  links: { fontSize: 9, color: "#3366cc", marginBottom: 16 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#d4d4d4", marginVertical: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#333", marginBottom: 6 },
  summary: { fontSize: 10, lineHeight: 1.5, marginBottom: 4 },
  expBlock: { marginBottom: 10 },
  expRole: { fontSize: 10.5, fontWeight: 700 },
  expMeta: { fontSize: 9, color: "#666", marginBottom: 2 },
  bullet: { fontSize: 9.5, lineHeight: 1.5, paddingLeft: 10, marginBottom: 1 },
  eduBlock: { marginBottom: 6 },
  eduTitle: { fontSize: 10, fontWeight: 500 },
  eduMeta: { fontSize: 9, color: "#666" },
  skillsRow: { fontSize: 9.5, lineHeight: 1.6 },
  certBlock: { marginBottom: 6 },
  certTitle: { fontSize: 10, fontWeight: 500 },
  certMeta: { fontSize: 9, color: "#666" },
  projBlock: { marginBottom: 8 },
  projName: { fontSize: 10, fontWeight: 500 },
  projDesc: { fontSize: 9.5, lineHeight: 1.5, marginTop: 1 },
  projLink: { fontSize: 9, color: "#3366cc", marginTop: 1 },
});

const ensureArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export function MinimalTemplate({ cv }: { cv: Record<string, any> }) {
  const personal = cv.personal || {};
  const summary = cv.summary;
  const experience = cv.experience || [];
  const education = cv.education || [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  const contactParts = [personal.email, personal.phone, personal.location, personal.date_of_birth].filter(Boolean);
  const linkParts = [
    personal.linkedin ? `LinkedIn: ${personal.linkedin}` : null,
    personal.website ? `Web: ${personal.website}` : null,
  ].filter(Boolean);

  const allSkills = skills
    ? Array.isArray(skills)
      ? skills
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{personal.name || "Nome Cognome"}</Text>
        <Text style={styles.contact}>{contactParts.join("  |  ")}</Text>
        {linkParts.length > 0 && <Text style={styles.links}>{linkParts.join("  |  ")}</Text>}

        {summary && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Profilo</Text>
            <Text style={styles.summary}>{summary}</Text>
          </>
        )}

        {experience.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Esperienza</Text>
            {experience.map((exp: any, i: number) => (
              <View key={i} style={styles.expBlock}>
                <Text style={styles.expRole}>
                  {exp.role || exp.title} — {exp.company}
                </Text>
                <Text style={styles.expMeta}>
                  {exp.start || exp.period}
                  {exp.end ? ` – ${exp.end}` : exp.current ? " – Attuale" : ""}
                  {exp.location ? ` · ${exp.location}` : ""}
                </Text>
                {exp.description && <Text style={styles.summary}>{exp.description}</Text>}
                {Array.isArray(exp.bullets) &&
                  exp.bullets.map((b: string, j: number) => (
                    <Text key={j} style={styles.bullet}>• {b}</Text>
                  ))}
              </View>
            ))}
          </>
        )}

        {education.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Formazione</Text>
            {education.map((ed: any, i: number) => (
              <View key={i} style={styles.eduBlock}>
                <Text style={styles.eduTitle}>
                  {ed.degree}{ed.field ? ` in ${ed.field}` : ""} — {ed.institution}
                </Text>
                <Text style={styles.eduMeta}>
                  {ed.start || ed.period}{ed.end ? ` – ${ed.end}` : ""}
                  {ed.grade ? ` · ${ed.grade}` : ""}
                </Text>
              </View>
            ))}
          </>
        )}

        {allSkills.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Competenze</Text>
            <Text style={styles.skillsRow}>{allSkills.join("  ·  ")}</Text>
          </>
        )}

        {skills?.languages && skills.languages.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Lingue</Text>
            <Text style={styles.skillsRow}>
              {skills.languages.map((l: any) => `${l.language}${l.level ? ` (${l.level})` : ""}`).join("  ·  ")}
            </Text>
          </>
        )}

        {certifications.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Certificazioni</Text>
            {certifications.map((cert: any, i: number) => (
              <View key={i} style={styles.certBlock}>
                <Text style={styles.certTitle}>
                  {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}
                </Text>
                {cert.year && <Text style={styles.certMeta}>{cert.year}</Text>}
              </View>
            ))}
          </>
        )}

        {projects.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Progetti</Text>
            {projects.map((proj: any, i: number) => (
              <View key={i} style={styles.projBlock}>
                <Text style={styles.projName}>{proj.name}</Text>
                {proj.description && <Text style={styles.projDesc}>{proj.description}</Text>}
                {proj.link && <Text style={styles.projLink}>{proj.link}</Text>}
              </View>
            ))}
          </>
        )}

        {extraSections.map((sec: any, i: number) => (
          <View key={i}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            {(sec.items || []).map((item: string, j: number) => (
              <Text key={j} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
