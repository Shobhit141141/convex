import { RawPageInput } from "@/types/classification-schema";

export const homepageFixture: RawPageInput = {
  url: "https://leena.ai/",
  title: "Agentic AI for the Enterprise Back Office | Leena AI",
  metaDescription: "Enterprise AI Platform with Pre-built AI Colleagues for HR, IT and Finance that go live in 45 days. 70%+ tickets auto-resolved, 4-10× ROI. Trusted by 500+ enterprises.",
  headings: {
    h1: ["Enterprise AI, live in 45 days"],
    h2: [
      "Most Agentic AI projects die within 14 months. Here's how ours go live in 45 days.",
      "Powering 20M+ employees across 500+ enterprises.",
      "Meet the three. Ready to work today.",
      "Leaders on the record: From go-live to ROI.",
      "A platform that earns the room from CIO to CHRO to CFO."
    ]
  },
  ctas: [
    { text: "Book a demo", href: "#", tag: "button" },
    { text: "Watch product tour", href: "/live-product-demo", tag: "button" },
    { text: "Contact Us", href: "/contact-us", tag: "a" }
  ],
  bodyExcerpt: "A platform that earns the room from CIO to CHRO to CFO. Pre-integrated with Workday, SAP, Oracle, ServiceNow."
};

export const hrFunctionalFixture: RawPageInput = {
  url: "https://leena.ai/function/hr",
  title: "Universal HR Assistant: Agentic AI for HR Ops | Leena AI",
  metaDescription: "Agentic AI for HR Operations. Automates 70%+ of HR tickets - benefits, letters, policy, records. Pre-integrated with Workday, ServiceNow & more. Live in 45 days.",
  headings: {
    h1: ["Most HR requests shouldn't reach a human. Now they don't."],
    h2: [
      "Multiple jobs. One AI Colleague. Zero queue.",
      "See what's live. See what's possible.",
      "Value unlocked with Harrison.",
      "Leaders on the record: From go-live to ROI."
    ]
  },
  ctas: [
    { text: "Book a demo", href: "#", tag: "button" },
    { text: "Book a personalised demo", href: "#", tag: "button" }
  ],
  bodyExcerpt: "Harrison closes Tier-1 HR requests - leave, letters, benefits, payroll - in seconds, not days. Built for HR leadership and People Ops."
};

export const christusWebinarFixture: RawPageInput = {
  url: "https://leena.ai/resources/webinars/christus-health-hr-ai-rollout-webinar",
  title: "HR AI Rollout: Inside CHRISTUS Health's AI Launch | Leena AI",
  metaDescription: "Jessica Hendrix ran the HR AI rollout at CHRISTUS Health. Hear what it took: the security review, the content cleanup, and how they drove adoption. Sept 17.",
  headings: {
    h1: ["What It Really Takes to Get 51,000 Employees Using AI"],
    h2: [
      "Featured speakers",
      "What you'll walk away with",
      "Ready to accelerate your Agentic AI journey?"
    ]
  },
  ctas: [
    { text: "Watch now", href: "#", tag: "button" },
    { text: "Book a demo", href: "#", tag: "button" }
  ],
  bodyExcerpt: "Join healthcare HR leaders from CHRISTUS Health to discover how 51,000 hospital employees were onboarded to generative AI assistants."
};

export const ambiguousPageFixture: RawPageInput = {
  url: "https://example.com/random-page",
  title: "",
  metaDescription: "",
  headings: {
    h1: [],
    h2: []
  },
  ctas: []
};

export const conflictingUrlPageFixture: RawPageInput = {
  url: "https://example.com/resources/webinar-archive",
  title: "Enterprise Pricing Plans | SaaS Suite",
  metaDescription: "Transparent monthly billing per user. Start free trial today.",
  headings: {
    h1: ["Simple, transparent pricing for growing teams"],
    h2: ["Choose your plan", "Enterprise tier"]
  },
  ctas: [
    { text: "Start free trial", href: "/signup", tag: "button" },
    { text: "Contact sales", href: "/contact", tag: "button" }
  ],
  bodyExcerpt: "Select from our standard or enterprise plan with per-seat billing and 14-day free trial."
};

export const missingCtaPageFixture: RawPageInput = {
  url: "https://example.com/company/manifesto",
  title: "Our Engineering Culture and Values",
  metaDescription: "How we think about building software.",
  headings: {
    h1: ["Building software with conviction"],
    h2: ["First principles", "Velocity and quality"]
  },
  ctas: []
};

export const multipleCtasPageFixture: RawPageInput = {
  url: "https://leena.ai/solutions",
  title: "Solutions Overview",
  headings: {
    h1: ["AI solutions across enterprise departments"]
  },
  ctas: [
    { text: "Book a demo", href: "#", tag: "button" },
    { text: "Watch product tour", href: "#", tag: "button" },
    { text: "Talk to sales", href: "#", tag: "button" },
    { text: "Read documentation", href: "#", tag: "a" }
  ]
};

export const missingAudienceFixture: RawPageInput = {
  url: "https://example.com/changelog/v2-release",
  title: "Changelog v2.4.0 Released",
  headings: {
    h1: ["Changelog v2.4.0"]
  },
  ctas: [
    { text: "View commits", href: "/commits", tag: "a" }
  ],
  bodyExcerpt: "Fixed memory leak in worker threads and updated telemetry dependencies."
};
