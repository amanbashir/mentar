export const saasStrategy = {
  stage_1: {
    objective: "Define a real-world problem that can be solved with a simple software tool.",
    checklist: [
      "Target industry selected (e.g. fitness, real estate, DTC brands)",
      "Problem identified (urgent + repetitive)",
      "Potential solution brainstormed",
      "3 competitors identified (feature gap analyzed)",
      "No-code MVP path considered"
    ],
    aiSupport: [
      "Use GPT to write a customer pain survey for niche validation",
      "Generate a list of 10 real-world problems in your industry",
      "Ask GPT to summarize 3 competitors and extract gaps",
      "Write a positioning statement based on your offer"
    ]
  },
  stage_2: {
    objective: "Map the MVP and plan development with speed and customer feedback in mind.",
    checklist: [
      "MVP feature list defined (must-have only)",
      "Wireframes or mockups created (Figma, Whimsical)",
      "No-code tool or dev team chosen",
      "Beta landing page live with email capture",
      "Initial waitlist of 25–50 people"
    ],
    aiSupport: [
      "Use GPT to prioritize MVP features based on your solution",
      "Generate copy for beta landing page (hero, CTA, proof)",
      "Create waitlist pop-up copy",
      "Draft onboarding email sequence for beta users"
    ]
  },
  stage_3: {
    objective: "Launch beta, gather feedback, and prove product-market fit.",
    checklist: [
      "Beta cohort onboarded",
      "Feedback loop (form or live chat) active",
      "1–2 paying users with clear use case",
      "Testimonial or quote captured",
      "Initial usage tracked (daily active users, churn, etc.)"
    ],
    aiSupport: [
      "Use GPT to write feedback form questions",
      "Create beta survey email templates",
      "Summarize user feedback into improvement priorities",
      "Write outreach email for testimonial or review"
    ]
  },
  stage_4: {
    objective: "Build a sales funnel and scale acquisition via organic + paid.",
    checklist: [
      "Positioning refined (based on beta feedback)",
      "Main site copy = problem > solution > proof > CTA",
      "Cold outreach sequences built (email or DMs)",
      "Content engine started (blog, Twitter, SEO)",
      "Meta or LinkedIn ads testing pain-point driven UGC"
    ],
    aiSupport: [
      "Use GPT to rewrite your homepage copy based on positioning",
      "Generate 3–5 cold email flows targeting your niche",
      "Draft blog outlines or SEO content from features list",
      "Write ad copy for UGC or pain-driven video scripts"
    ]
  },
  stage_5: {
    objective: "Systemize onboarding, support, and usage to reduce churn.",
    checklist: [
      "Live chat + help docs added",
      "Onboarding flow mapped (email, product tours)",
      "Churn trigger emails set (inactivity, drop-off)",
      "Monthly update + usage report",
      "Support SOP built"
    ],
    aiSupport: [
      "Use GPT to draft help doc structure and FAQ",
      "Write onboarding emails explaining core features",
      "Create reactivation emails for churn risk users",
      "Build a product update email template"
    ]
  },
  scaling: {
    objective: "Grow to consistent MRR while keeping churn under control.",
    levers: [
      "Affiliate program launched",
      "B2B outbound sales rep hired",
      "Tiered pricing tested",
      "Segmented onboarding flows",
      "CS team added with SLA-based support"
    ],
    delegation: {
      phase1: ["Support Operator", "Growth Marketer", "Dev Lead"],
      phase2: ["AE / Closer", "Community Manager", "Lifecycle Email Specialist"]
    },
    aiSupport: [
      "Use GPT to generate onboarding paths by customer segment",
      "Write outbound scripts for sales closers",
      "Draft partner pitch email or affiliate page copy",
      "Help write job posts for support and marketing hires"
    ]
  }
};