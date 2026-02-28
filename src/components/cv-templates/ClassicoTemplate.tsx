import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

// Register DM Sans from Google Fonts
Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZ-IHTWEBlwp.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.ttf", fontWeight: 700, fontStyle: "normal" },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, color: "#1a1a1a", paddingBottom: 68 },
  header: {
    backgroundColor: "#141518",
    paddingHorizontal: 68,
    paddingVertical: 28,
    color: "#F2F3F7",
  },
  headerName: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  headerContact: { fontSize: 9, color: "#8B8FA8", flexDirection: "row", gap: 12, flexWrap: "wrap" },
  body: { paddingHorizontal: 68, paddingTop: 20 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#141518",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d0d0d0",
    paddingBottom: 3,
    marginBottom: 8,
    marginTop: 16,
  },
  summary: { fontSize: 10, lineHeight: 1.5, marginBottom: 4 },
  expBlock: { marginBottom: 10 },
  expRole: { fontSize: 11, fontWeight: 700 },
  expMeta: { fontSize: 9, color: "#555", marginBottom: 2 },
  bullet: { fontSize: 9.5, lineHeight: 1.5, paddingLeft: 10, marginBottom: 1 },
  eduBlock: { marginBottom: 6 },
  eduTitle: { fontSize: 10, fontWeight: 500 },
  eduMeta: { fontSize: 9, color: "#555" },
  skillsRow: { fontSize: 9.5, lineHeight: 1.6, flexDirection: "row", flexWrap: "wrap" },
  extraBlock: { marginBottom: 6 },
});

const ensureArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export function ClassicoTemplate({ cv }: { cv: Record<string, any> }) {
  const personal = cv.personal || {};
  const summary = cv.summary;
  const experience = cv.experience || [];
  const education = cv.education || [];
  const skills = cv.skills;
  const extraSections = cv.extra_sections || [];

  const contactParts = [personal.email, personal.phone, personal.location].filter(Boolean);

  const allSkills = skills
    ? Array.isArray(skills)
      ? skills
      : [...ensureArray(skills.technical), ...ensureArray(skills.soft), ...ensureArray(skills.tools)]
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{personal.name || "Nome Cognome"}</Text>
          <View style={styles.headerContact}>
            {contactParts.map((c: string, i: number) => (
              <Text key={i}>{c}</Text>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {/* Summary */}
          {summary && (
            <>
              <Text style={styles.sectionTitle}>Profilo</Text>
              <Text style={styles.summary}>{summary}</Text>
            </>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <>
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
                      <Text key={j} style={styles.bullet}>
                        • {b}
                      </Text>
                    ))}
                </View>
              ))}
            </>
          )}

          {/* Education */}
          {education.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Formazione</Text>
              {education.map((ed: any, i: number) => (
                <View key={i} style={styles.eduBlock}>
                  <Text style={styles.eduTitle}>
                    {ed.degree}
                    {ed.field ? ` in ${ed.field}` : ""} — {ed.institution}
                  </Text>
                  <Text style={styles.eduMeta}>
                    {ed.start || ed.period}
                    {ed.end ? ` – ${ed.end}` : ""}
                    {ed.grade ? ` · ${ed.grade}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Skills */}
          {allSkills.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Competenze</Text>
              <View style={styles.skillsRow}>
                <Text>{allSkills.join("  ·  ")}</Text>
              </View>
            </>
          )}

          {/* Languages */}
          {skills?.languages && skills.languages.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Lingue</Text>
              <View style={styles.skillsRow}>
                <Text>
                  {skills.languages
                    .map((l: any) => `${l.language}${l.level ? ` (${l.level})` : ""}`)
                    .join("  ·  ")}
                </Text>
              </View>
            </>
          )}

          {/* Extra Sections */}
          {extraSections.map((sec: any, i: number) => (
            <View key={i}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              {(sec.items || []).map((item: string, j: number) => (
                <Text key={j} style={styles.bullet}>
                  • {item}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
