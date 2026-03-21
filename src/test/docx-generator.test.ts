import { describe, it, expect } from "vitest";
import { generateDocx } from "@/components/cv-templates/docx-generator";

const testCv = {
  personal: {
    name: "Mario Rossi",
    email: "mario@test.com",
    phone: "+39 333 1234567",
    location: "Milano, Italia",
    linkedin: "linkedin.com/in/mariorossi",
  },
  summary: "Professionista con 10 anni di esperienza nel settore IT.",
  experience: [
    {
      role: "Senior Developer",
      company: "Acme Corp",
      location: "Milano",
      start: "Gen 2020",
      end: "",
      current: true,
      bullets: [
        "Aumentato il fatturato del +30% annuo",
        "Gestito team di 15 persone",
        "Implementato architettura microservizi",
      ],
    },
    {
      role: "Developer",
      company: "Beta Srl",
      start: "2018-03",
      end: "2019-12",
      bullets: [
        "Sviluppato 5 applicazioni web",
        "Ridotto i tempi di deploy del 40%",
      ],
    },
  ],
  education: [
    {
      degree: "Laurea Magistrale",
      field: "Informatica",
      institution: "Politecnico di Milano",
      start: "Set 2013",
      end: "Mar 2016",
      grade: "110/110",
      honors: "e lode",
    },
  ],
  skills: {
    technical: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    soft: ["Leadership", "Problem solving"],
    tools: ["Docker", "AWS"],
    languages: [
      { language: "Italiano", level: "Madrelingua" },
      { language: "Inglese", level: "C1", descriptor: "Fluente" },
    ],
  },
  certifications: [
    { name: "AWS Solutions Architect", issuer: "Amazon", year: "2021" },
  ],
  projects: [
    { name: "OpenCV Tool", description: "Tool open source per l'analisi CV" },
  ],
};

describe("generateDocx", () => {
  it("should generate a valid Blob", async () => {
    const blob = await generateDocx(testCv);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  it("should generate with lang=en", async () => {
    const blob = await generateDocx(testCv, "en");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("should handle minimal CV", async () => {
    const blob = await generateDocx({ personal: { name: "Test" } });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it("should handle empty CV", async () => {
    const blob = await generateDocx({});
    expect(blob).toBeInstanceOf(Blob);
  });

  it("should handle flat skills array", async () => {
    const blob = await generateDocx({
      personal: { name: "Test" },
      skills: ["React", "Node.js"],
    });
    expect(blob).toBeInstanceOf(Blob);
  });
});
