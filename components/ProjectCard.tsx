import type { Project } from "@/data/projects";
import Badge from "@/components/Badge";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-line bg-surface/60 p-6 transition-colors duration-300 hover:border-accent/40 hover:bg-surface">
      <h3 className="text-lg font-semibold text-ink">{project.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {project.description}
      </p>

      <ul className="mt-5 space-y-2">
        {project.highlights.map((h) => (
          <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted">
            <span
              aria-hidden
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
            />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-6">
        {project.github ? (
          <a
            href={project.github}
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            aria-label={`View source for ${project.title} on GitHub`}
          >
            GitHub
          </a>
        ) : null}
        {project.demo ? (
          <a
            href={project.demo}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
            aria-label={`View live demo for ${project.title}`}
          >
            Demo &rarr;
          </a>
        ) : null}
      </div>
    </article>
  );
}
