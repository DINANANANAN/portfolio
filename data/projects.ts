export type Project = {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  highlights: string[];
  github?: string;
  demo?: string;
  note?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "whatsapp-sales-bot",
    title: "WhatsApp Sales Automation Bot",
    description:
      "A WhatsApp-based chatbot system that automates customer inquiries, collects customer needs, recommends suitable services, and answers product-related questions using a knowledge bank.",
    stack: [
      "FastAPI",
      "SQLite",
      "Botika Webhook",
      "ChromaDB",
      "Python",
      "PDF Processing",
      "Embeddings",
      "Ollama",
    ],
    highlights: [
      "Developed a WhatsApp-based sales automation bot using FastAPI and webhook integration to handle customer inquiries and automate initial sales conversations.",
      "Implemented multi-step conversation flow and state management with SQLite to collect customer needs, company details, and service requirements.",
      "Built recommendation logic to suggest suitable services or prospects based on customer input and internal business data.",
      "Integrated a knowledge bank using ChromaDB, PDF processing, embeddings, and AI-generated responses to answer product-related questions with reduced hallucination.",
      "Designed backend endpoints for receiving, processing, and responding to WhatsApp messages through Botika webhook integration.",
    ],
    note: "Internal — guarded by NDA",
  },
  {
    slug: "billiard-super-app",
    title: "Billiard Super App",
    description:
      "A mobile app for billiard players: match history, tournaments, rankings, player profiles, and pool hall discovery.",
    stack: [
      "Flutter",
      "Supabase",
      "PostgreSQL",
      "Authentication",
      "Database Migration",
      "Ranking System",
    ],
    highlights: [
      "Developed match and tournament history features for tracking player performance and game results.",
      "Planned a scalable Supabase database structure for player profiles, pool halls, rankings, achievements, and match records.",
      "Explored ranking system design using ELO and Glicko concepts to support competitive player progression.",
      "Worked with database migrations, authentication flow, and feature planning for MVP development.",
      "Collaborated in a team-based workflow using GitHub issues, branching, and pull requests.",
    ],
    github: "#",
    demo: "https://ptera.id/id/",
  },
  {
    slug: "athlete-tracking",
    title: "Athlete Tracking Web App",
    description:
      "A Laravel-based web application for managing athlete data, records, and tracking information.",
    stack: ["Laravel 11", "MySQL", "PHP", "Forge", "DigitalOcean"],
    highlights: [
      "Built a database-driven web application for managing athlete-related records.",
      "Implemented CRUD functionality using Laravel and MySQL.",
      "Worked on the application deployment flow using Laravel Forge and DigitalOcean.",
      "Structured backend logic to support data entry, retrieval, and management.",
      "Debugged routing and deployment issues during development.",
    ],
    github: "#",
    demo: "#",
  },
];
