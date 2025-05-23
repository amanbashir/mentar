export const smmaBlueprint = {
  preQualification: {
    description: "Check if the user is fit for SMMA before starting.",
    questions: [
      "Are you willing to do outreach every day for 30–60 days before seeing results?",
      "Do you enjoy speaking with business owners and pitching?",
      "Can you learn and apply digital marketing platforms fast (Meta Ads, TikTok, IG)?",
      "Are you outcome-obsessed — willing to do whatever it takes to get client results?",
      "Are you willing to start solo, but grow into a system/team business?",
      "When do you wish to launch your SMMA business?"
    ],
    guidance: "If YES to most, proceed. If not, consider freelance or productized offers first."
  },

  stage_1: {
    objective: "Create a high-conviction niche and a no-brainer offer that is easy to sell and results-driven.",
    steps: [
      {
        title: "Choose Your Niche Wisely",
        criteria: [
          "Has high LTV clients (health, fitness, legal, real estate, coaches)",
          "Actively spending on ads or growth",
          "Poor social media presence or outdated ad strategies"
        ]
      },
      {
        title: "Build a No-Brainer Offer",
        examples: [
          "Paid ad service (Meta/TikTok) for lead gen",
          "UGC content (Reels/TikToks) for authority building",
          "Appointment setting via DM/CRM integration"
        ],
        lowRiskAngles: [
          "Pay per lead",
          "First 14 days free",
          "10 videos free if no results"
        ],
        samplePitch: "We generate qualified leads using short-form video + paid traffic. You only pay when we deliver results."
      }
    ]
  },

  stage_2: {
    objective: "Book 10–30 sales calls per month using cold outreach, value-driven content, and free work.",
    steps: [
      {
        title: "X (Twitter) Authority Building",
        tactics: [
          "Post 1–2x/day with growth tips",
          "Critique trending Reels/TikToks",
          "Share case studies and results",
          "Run giveaways (e.g., DM 'audit')"
        ]
      },
      {
        title: "Cold Outreach Strategy",
        tools: ["Instantly", "Clay", "Apollo"],
        actions: [
          "Send 50–100 targeted emails/day",
          "Send 20–30 DMs/day on IG or X"
        ],
        dmScript: "Hey [Name], just watched your latest Reel. Solid content — but I see 3 easy ways to double reach + lead flow. Want a free breakdown?",
        emailStructure: [
          "1 sentence social proof",
          "1 insight into their content/ad presence",
          "1 CTA: 'Want me to shoot you a 2-min audit video?'"
        ]
      },
      {
        title: "Loom Pitches",
        instruction: "Record 60–90s Looms for 5 leads/day reviewing their socials and suggesting 1–2 improvements.",
        callToAction: "Want us to test this strategy for you?"
      },
      {
        title: "Offer Free Work",
        actions: [
          "Pick 1–3 clients in niche",
          "Run 7–14 day campaigns",
          "Create 5–10 videos, 1 ad, and lead funnel"
        ],
        resultTracking: ["CTR", "reach", "leads", "calls"],
        buildCaseStudy: [
          "Before/after visuals",
          "DMs or testimonials",
          "Metrics screenshots"
        ]
      }
    ]
  },

  stage_3: {
    objective: "Deliver repeatable results with a systemized fulfillment engine.",
    steps: [
      {
        title: "Ad & Organic Content System",
        process: [
          "Run Meta/TikTok ads",
          "Create 5–10 short-form pieces/week",
          "Distribute via repurpose.io to IG, TikTok, Shorts"
        ]
      },
      {
        title: "Lead Handling",
        tools: ["Meta + GoHighLevel", "Close.com"],
        setup: [
          "Install booking forms",
          "DM auto-replies",
          "Slack/Telegram lead alerts"
        ]
      },
      {
        title: "Client Reporting",
        process: [
          "Weekly Slack or Loom updates",
          "Metrics dashboard (Looker Studio)",
          "Bi-weekly optimization calls"
        ]
      }
    ]
  },

  stage_4: {
    objective: "Scale the business with systems and team to reach $20k–$50k/month.",
    steps: [
      {
        title: "Hire for Organic Growth",
        roles: [
          "TikTok/Reels editor/strategist",
          "VA for content repurposing",
          "Engagement specialist"
        ]
      },
      {
        title: "Build a Lean Team",
        roles: [
          "Editor",
          "Media Buyer (certified)",
          "Outreach VA",
          "Agency content creator",
          "Project Manager (optional after $15k/mo)"
        ]
      },
      {
        title: "SOPs & Templates",
        tools: ["Notion", "Airtable"],
        contents: ["Content creation", "Ad testing", "Client reporting"]
      },
      {
        title: "Onboarding Automation",
        setup: [
          "Typeform questionnaire",
          "Auto-create folder, Slack channel, GHL account",
          "Send welcome video + roadmap"
        ]
      },
      {
        title: "Finance & Ops",
        tools: ["Wave", "QuickBooks", "Wise", "Payoneer"],
        metrics: ["MRR", "client churn", "cost per lead", "profit margin"]
      }
    ]
  },

  stage_5: {
    objective: "Retain clients and optimize agency profitability.",
    metrics: {
      CPA: "< $30",
      retention: "4+ months",
      profitMargin: "40–60%",
      weeklyCalls: "10+",
      ROAS: "2.5–4.0+"
    },
    retentionLevers: [
      "Weekly Slack/Loom updates",
      "Share industry/testing insights",
      "Quarterly strategy revamps",
      "Add bonuses: funnels, nurture, content"
    ]
  },

  finalNote: "This agency model is built for speed and leverage. Nail the niche and offer, build proof, acquire clients fast, and scale via systems."
};
