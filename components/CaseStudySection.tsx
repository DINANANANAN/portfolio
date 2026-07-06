import Section from "@/components/Section";
import Badge from "@/components/Badge";

const BLOCKS: { heading: string; body: string }[] = [
  {
    heading: "Problem",
    body: "Many businesses receive customer inquiries through WhatsApp, but the sales process is often manual and repetitive. Sales teams need to answer similar questions, ask for customer details one by one, and manually identify which service fits the customer.",
  },
  {
    heading: "Solution",
    body: "I built a WhatsApp-based automation system that guides users through a structured chatbot flow, collects important customer information, recommends suitable services, and answers product-related questions using a knowledge bank.",
  },
  {
    heading: "My Role",
    body: "I worked on the backend system, chatbot flow, state management, webhook handling, recommendation logic, and knowledge bank integration.",
  },
  {
    heading: "Technical Implementation",
    body: "Incoming WhatsApp messages are received through a webhook and sent to the FastAPI backend. The backend checks the user's current conversation stage from SQLite, processes the message, and returns the appropriate response. If the user asks a product-related question, the system searches the knowledge bank using embeddings and ChromaDB before generating an answer.",
  },
  {
    heading: "Challenges",
    body: "One major challenge was managing multi-step conversations, because users can reply in different ways. To solve this, I used conversation state management so the bot could remember each user's current stage. Another challenge was reducing inaccurate AI answers, which I addressed by using retrieval from company documents instead of relying only on general AI responses.",
  },
  {
    heading: "Result / Learning",
    body: "The system automated basic sales conversations, collected structured customer requirements, provided service recommendations, and helped prepare information for sales follow-up. This project helped me understand how backend APIs, webhooks, databases, chatbot flows, and AI retrieval systems can work together in a real business use case.",
  },
];

const KEY_FEATURES = [
  "Automated WhatsApp conversation flow",
  "Customer need collection",
  "Service recommendation logic",
  "Knowledge bank for product questions",
  "Webhook integration",
  "Conversation state management",
];

const TECH = [
  "FastAPI",
  "SQLite",
  "ChromaDB",
  "Embeddings",
  "Botika Webhook",
  "Ollama",
];

export default function CaseStudySection() {
  return (
    <Section
      id="case-study"
      index="04"
      title="Case Study: WhatsApp Sales Automation Bot"
      eyebrow="A closer look at how the automation system was designed and built."
    >
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {BLOCKS.map((b) => (
            <div key={b.heading}>
              <h3 className="font-mono text-xs uppercase tracking-widest text-accent/80">
                {b.heading}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
        <aside>
          <div className="rounded-xl border border-line bg-surface/50 p-6 lg:sticky lg:top-24">
            <h3 className="font-mono text-xs uppercase tracking-widest text-accent/80">
              Key Features
            </h3>
            <ul className="mt-4 space-y-3">
              {KEY_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-muted">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-6">
              {TECH.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
