import Section from "@/components/Section";

const FACTS: [string, string][] = [
  ["Focus", "Web · Mobile · Backend · Automation"],
  ["Approach", "Product-minded, practical, reliable"],
  ["Currently", "Building AI-assisted & automation systems"],
];

export default function AboutSection() {
  return (
    <Section id="about" index="01" title="About Me">
      <div className="grid gap-10 md:grid-cols-3">
        <p className="text-base leading-relaxed text-muted md:col-span-2">
          I&apos;m a software developer with experience building web, mobile, and
          backend systems. I enjoy creating practical applications that solve real
          problems, from sales automation tools and database-driven web apps
          to mobile platforms and AI-assisted systems. I focus on clean structure,
          reliable backend logic, and user-friendly product experiences.
        </p>
        <ul className="space-y-4">
          {FACTS.map(([k, v]) => (
            <li key={k} className="border-l border-line pl-4">
              <span className="block font-mono text-xs uppercase tracking-widest text-accent/80">
                {k}
              </span>
              <span className="mt-1 block text-sm text-muted">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
