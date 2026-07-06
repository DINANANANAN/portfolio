import Section from "@/components/Section";

type Contact = { label: string; value: string; href: string };

const CONTACTS: Contact[] = [
  {
    label: "Email",
    value: "ferdinan.nathanael28@gmail.com",
    href: "mailto:ferdinan.nathanael28@gmail.com",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/ferdinan-nathanael",
    href: "https://www.linkedin.com/in/ferdinan-nathanael-36abb9384/",
  },
  {
    label: "GitHub",
    value: "github.com/FerdinanNathanael",
    href: "https://github.com/FerdinanNathanael",
  },
];

export default function ContactSection() {
  return (
    <Section
      id="contact"
      index="07"
      title="Get in Touch"
      eyebrow="Open to opportunities and collaboration. Feel free to reach out."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <ul className="space-y-4 md:col-span-2">
          {CONTACTS.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center justify-between rounded-xl border border-line bg-surface/40 px-5 py-4 transition-colors hover:border-accent/40 hover:bg-surface"
              >
                <span>
                  <span className="block font-mono text-xs uppercase tracking-widest text-accent/80">
                    {c.label}
                  </span>
                  <span className="mt-1 block text-sm text-ink">{c.value}</span>
                </span>
                <span
                  aria-hidden
                  className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
                >
                  &rarr;
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col justify-center rounded-xl border border-line bg-surface/40 p-6">
          <p className="text-sm text-muted">Want the full details?</p>
          <a
            href="/Ferdinan-Nathanael-CV.pdf"
            download
            className="mt-4 inline-flex items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            aria-label="Download Ferdinan Nathanael's CV (PDF)"
          >
            Download CV
          </a>
        </div>
      </div>
    </Section>
  );
}
