import type { ExperienceManifest } from "../../lib/types";

export const customerSupport: ExperienceManifest = {
  id: "customer-support",
  name: "Customer Support",
  description: "Handle support tickets, draft responses, manage FAQs, and track customer issues",
  icon: "Headphones",
  category: "business",
  author: "Houston",
  tags: ["support", "tickets", "customer", "help", "faq"],
  tabs: [
    { id: "chat", label: "Chat", builtIn: "chat" },
    { id: "activity", label: "Tickets", builtIn: "board" },
    { id: "context", label: "Knowledge", builtIn: "context" },
    { id: "channels", label: "Channels", builtIn: "channels" },
    { id: "skills", label: "Skills", builtIn: "skills" },
    { id: "learnings", label: "Learnings", builtIn: "learnings" },
  ],
  defaultTab: "chat",
  claudeMd:
    "## Instructions\n\nYou are a customer support agent. Draft helpful, empathetic responses to customer inquiries. Track issues to resolution. Build a knowledge base from resolved tickets.\n\n## Learnings\n",
};
