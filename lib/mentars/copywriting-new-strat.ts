
export const copywritingBlueprint = {
  preQualification: {
    description: "Evaluate if copywriting is a good fit before starting.",
    questions: [
      "How many hours/week can you commit to writing?",
      "Are you comfortable selling services without experience?",
      "Do you enjoy psychology, marketing, or persuasive writing?",
      "Are you willing to offer free work for proof/testimonials?",
      "What income are you targeting in the next 3 months?",
      "Do you want to write for brands, creators, or businesses?",
      "When do you wish to launch your copywriting business?"
    ],
    actions: [
      "Score responses (1–5 scale)",
      "If aligned, proceed",
      "If not, suggest content writing or affiliate marketing"
    ]
  },
  stage_1: {
    objective: "Start with zero experience and build 3–5 case studies via free client work.",
    steps: [
      {
        title: "Choose a Niche",
        examples: ["DTC brands (ecom, wellness, beauty)", "Coaches / info-products", "SaaS startups", "Local services"],
        tip: "Pick one niche. Don’t generalize early."
      },
      {
        title: "Offer Free Work (Strategically)",
        process: [
          "Message 15–20 small businesses or creators",
          "Offer free value first (e.g., rewritten ad or headline)",
          "Revamp 1 full asset in exchange for testimonial and portfolio use"
        ],
        freeWorkPriorities: [
          "2 email sequences (5–7 emails each)",
          "1 landing page",
          "2 ad sets",
          "1 long-form sales page"
        ]
      },
      {
        title: "Document Everything",
        instructions: [
          "Use Notion or Framer for portfolio",
          "Show before/after copy",
          "Include testimonials, performance screenshots, Looms"
        ]
      }
    ]
  },

  stage_2: {
    objective: "Learn copywriting structure, voice, and formats through daily practice.",
    dailyRoutine: {
      schedule: "45 mins/day, Mon–Fri for 2–4 weeks",
      steps: [
        "Read a long-form sales letter",
        "Analyze the customer (demographics, pain points)",
        "Write 6–10 bullet points inspired by the copy",
        "Write 1 original email/headline/ad"
      ],
      completionChecklist: [
        "5 sales letters studied",
        "5 customer profiles analyzed",
        "30–50 bullet points written",
        "5 original writing exercises",
        "1x/week public post on LinkedIn or Twitter"
      ]
    }
  },

  stage_3: {
    objective: "Land clients with lean, value-first acquisition strategies and no-brainer offers.",
    steps: [
      {
        title: "Build Positioning",
        formula: "I help [niche] get more [sales/leads] with sharp, conversion-first copy.",
        useIn: ["Bios", "Cold DMs", "Outreach emails"]
      },
      {
        title: "Client Acquisition System",
        outreach: {
          dm: "10–15 brands/day",
          email: {
            rate: "5–10/day",
            structure: [
              "Subject: 'Tweak your landing headline?'",
              "1-line audit insight",
              "1-liner offer",
              "CTA to review portfolio"
            ]
          }
        },
        platforms: ["Upwork", "Fiverr"],
        content: "Post copy tips, rewrites, and results 3x/week"
      },
      {
        title: "Irresistible Offer Templates",
        offers: [
          {
            name: "Risk-Free Results",
            description: "3-part email sequence, only pay if it beats existing performance, includes 3 subject line variations"
          },
          {
            name: "ROI-First Guarantee",
            description: "Landing page rewrite, pay only if happy or it improves conversion rate, includes Loom walkthrough + 2 headline tests"
          },
          {
            name: "Audit + Rewrite Combo",
            description: "Teardown + rewrite of an email/ad, client keeps copy for free if not satisfied"
          }
        ]
      },
      {
        title: "Pitch Flow (DM or Email)",
        structure: [
          "Pattern interrupt",
          "Mini audit insight",
          "Offer value (free work)",
          "CTA: 'Want me to send a draft?'"
        ]
      }
    ]
  },

  stage_4: {
    objective: "Deliver high-converting copy consistently with a repeatable system.",
    steps: [
      "Discovery call or async questionnaire",
      "Customer research (Reddit, reviews, transcripts)",
      "Copy draft in 3–5 days",
      "Loom walkthrough of final draft",
      "1–2 rounds of revisions max"
    ],
    frameworks: ["PAS", "AIDA", "4 Ps", "FAB", "Bullet point formulas"]
  },

  stage_5: {
    objective: "Transition to paid work, retain clients, and scale with systems or a team.",
    steps: [
      {
        title: "Transition to Paid Work",
        criteria: "After 3 solid case studies",
        pricing: {
          emails: "$250+",
          landingPages: "$500+",
          anchors: "Based on CTR, leads, conversions"
        }
      },
      {
        title: "Move to Retainers",
        packages: [
          "Email marketing: $1,000–$2,500/mo",
          "Blog + email: $1,500/mo",
          "Launch copy: $1,000+/project"
        ]
      },
      {
        title: "Grow Your Team",
        hires: [
          "Junior copywriters or ghostwriters",
          "VA for inbox and client comms",
          "Project/task management tools (Notion, Trello, ClickUp)"
        ],
        SOPs: ["Brief templates", "Research docs", "Delivery formatting"]
      },
      {
        title: "Productize Services",
        examples: [
          "Sales Page in 5 Days",
          "Launch Email Kit",
          "Lead funnels via email + LinkedIn/Twitter"
        ]
      },
      {
        title: "Advanced Practice Loop",
        ongoing: [
          "Read 1 sales letter/day",
          "Review junior writer copy weekly",
          "Keep publishing your own writing"
        ]
      }
    ],
    metrics: {
      dailyPractice: "5x/week",
      freeProjects: "3–5",
      clientsPerMonth: "1–2",
      hourlyRate: "$50–$100+",
      retainerGoal: "$2k+/mo recurring",
      closeRate: "30–50%"
    },
    tools: {
      clientOps: ["Notion", "Trello", "ClickUp"],
      invoicing: ["Stripe", "PayPal"],
      portfolio: ["Google Docs", "Loom"],
      leadGen: ["Beehiiv", "ConvertKit", "Upwork", "Fiverr"]
    }
  }
};
