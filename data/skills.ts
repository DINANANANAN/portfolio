export type SkillGroup = {
  title: string;
  items: string[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: "Frontend / Mobile",
    items: ["React", "Next.js", "Flutter", "HTML", "CSS", "JavaScript"],
  },
  {
    title: "Backend",
    items: ["FastAPI", "Laravel", "ASP.NET Web Forms", "Firebase", "Supabase"],
  },
  {
    title: "Database",
    items: [
      "PostgreSQL",
      "MySQL",
      "SQL Server",
      "SQLite",
      "Supabase PostgreSQL",
    ],
  },
  {
    title: "Tools & Workflow",
    items: [
      "Git",
      "GitHub",
      "VS Code",
      "Visual Studio",
      "API Testing",
      "Cloudflared",
      "Figma / Canva",
    ],
  },
  {
    title: "AI / Automation",
    items: [
      "ChromaDB",
      "Embeddings",
      "RAG",
      "Webhook Integration",
      "PDF Knowledge Base",
      "Ollama",
    ],
  },
];
