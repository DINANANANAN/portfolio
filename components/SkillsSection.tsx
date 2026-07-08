import Section from "@/components/Section";
import Badge from "@/components/Badge";
import { SKILL_GROUPS } from "@/data/skills";

export default function SkillsSection() {
  return (
    <Section
      id="skills"
      title="Skills"
      eyebrow="Tools and technologies I work with across the stack."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-xl border border-line bg-surface/50 p-6"
          >
            <h3 className="font-mono text-sm text-ink">{group.title}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
