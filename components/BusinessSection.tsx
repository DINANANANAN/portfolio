import Section from "@/components/Section";

const ITEMS = [
  {
    title: "Digital Business Planning",
    detail:
      "Planning digital products and services from concept toward go-to-market.",
  },
  {
    title: "Branding & Online Presence",
    detail: "Shaping brand identity and online presence for products and ventures.",
  },
  {
    title: "Logistics / Forwarding Concept",
    detail: "Exploring a forwarding and logistics business model and workflow.",
  },
  {
    title: "Building Material & Aluminum",
    detail: "Business concepts around building materials and aluminum supply.",
  },
  {
    title: "Product Workflow Planning",
    detail:
      "Structuring product workflows that connect business goals with delivery.",
  },
];

export default function BusinessSection() {
  return (
    <Section
      id="business"
      index="06"
      title="Product & Business"
      eyebrow="Beyond code, I think about products and business — how software connects to real value."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <div
            key={it.title}
            className="rounded-xl border border-line bg-surface/40 p-5 transition-colors hover:border-accent/30"
          >
            <h3 className="text-sm font-semibold text-ink">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.detail}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
