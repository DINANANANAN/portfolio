import Section from "@/components/Section";
import Badge from "@/components/Badge";

const TIMELINE = [
  {
    role: "Software Developer Intern",
    org: "PLN ICON PLUS",
    period: "2026 — Present",
    detail:
      "Focused on chatbot development and database maintenance — building automation and AI-assisted internal tools.",
  },
  {
    role: "Computer Science Undergraduate",
    org: "Binus University",
    period: "2023 — Present",
    detail:
      "Software development coursework spanning backend systems, databases, web programming, and software design.",
  },
];

const COURSEWORK = [
  "Object-Oriented Programming",
  "Database Systems",
  "Web Programming",
  "Domain-Driven Design",
  "Agile / Scrum",
  "Systems Analysis & Design",
  "Data Structures",
  "Software Engineering",
];

export default function ExperienceSection() {
  return (
    <Section id="experience" index="05" title="Experience & Education">
      <div className="grid gap-12 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {TIMELINE.map((item) => (
            <div key={item.role} className="relative border-l border-line pl-6">
              <span
                aria-hidden
                className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"
              />
              <p className="font-mono text-xs text-faint">{item.period}</p>
              <h3 className="mt-1 text-base font-semibold text-ink">{item.role}</h3>
              <p className="text-sm text-accent/90">{item.org}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-accent/80">
            Relevant Coursework
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {COURSEWORK.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
