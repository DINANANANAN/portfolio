import Section from "@/components/Section";
import ProjectCard from "@/components/ProjectCard";
import { PROJECTS } from "@/data/projects";

export default function ProjectsSection() {
  return (
    <Section
      id="projects"
      title="Featured Projects"
      eyebrow="A selection of systems I've designed and built, from sales automation to mobile platforms and database-driven web apps."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </Section>
  );
}
