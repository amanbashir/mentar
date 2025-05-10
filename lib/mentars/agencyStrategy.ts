export const agencyStrategy = {
  stage_1: {
    objective: "Pick a profitable niche and define a high-value service offer.",
    checklist: [
      "Niche selected (e.g. dentists, med spas, real estate)",
      "Service offer chosen (e.g. lead generation, paid ads, UGC content)",
      "Market demand confirmed (Google Trends, Reddit, TikTok validation)",
      "Competitor agencies identified",
      "Initial angle/hook brainstormed"
    ],
    aiSupport: [
      "Use GPT to list top 10 agency niches based on client LTV and spending power",
      "Generate 5 offer ideas for a specific niche (e.g., real estate ads, medspa UGC)",
      "Use GPT to analyze 3 competitor agency sites and summarize their offer stacks",
      "Ask GPT to brainstorm differentiators and positioning statements"
    ]
  },
  stage_2: {
    objective: "Build your agency brand and conversion funnel (site, booking link, SOPs)",
    checklist: [
      "Domain purchased + website theme installed (Notion, Typedream, Carrd, or Shopify)",
      "Service page copy created (problem > proof > outcome > CTA)",
      "Booking page live (Calendly, TidyCal, etc.)",
      "Case study or offer walkthrough added",
      "Klaviyo email capture installed"
    ],
    aiSupport: [
      "Use GPT to write landing page copy (hero, social proof, CTA)",
      "Generate 3 headline variations to test on home page",
      "Auto-write your Calendly intro and confirmation emails",
      "Create follow-up email for no-shows using GPT"
    ]
  },
  stage_3: {
    objective: "Develop outreach systems and book sales calls with cold + warm leads.",
    outreachTypes: [
      "Cold email",
      "Instagram/TikTok DMs",
      "Upwork/LinkedIn proposals",
      "Niche Facebook groups + Reddit posts"
    ],
    outreachChecklist: [
      "1–2 channels selected",
      "Scripts written for value-first cold approach",
      "List of 50 leads prepared",
      "SOP created for daily outreach process",
      "CRM sheet set up to track convos and follow-up"
    ],
    aiSupport: [
      "Use GPT to write cold outreach scripts (email, DMs) for your niche",
      "Generate subject lines and CTA variations",
      "Roleplay common objections with AI before sales calls",
      "Summarize call notes or prep agendas"
    ]
  },
  stage_4: {
    objective: "Deliver your service, build retention, and document your results.",
    clientDeliverySteps: [
      "Client onboarding form + kickoff call SOP",
      "Ad creative / lead capture assets collected",
      "Tracking system live (e.g. Google Sheet or Meta Manager)",
      "Reporting cadence agreed on (weekly/biweekly)",
      "Testimonial requested within 14 days of results"
    ],
    aiSupport: [
      "Use GPT to write onboarding form and welcome email",
      "Auto-create your weekly client reporting email template",
      "Ask GPT to suggest optimizations for ad campaigns",
      "Generate testimonial request email with deadline incentive"
    ]
  },
  stage_5: {
    objective: "Systemize delivery, install creative engine, and scale outreach team.",
    dailySystems: [
      "Lead gen SOP (daily outreach from VA or cold email tool)",
      "Creative team uploading 2–3 ads/week",
      "CSAT form or survey from every client monthly",
      "Weekly reporting dashboard review",
      "Client results database (Notion or Airtable)"
    ],
    tools: [
      "Loom for SOPs",
      "Trello/ClickUp/Notion for project management",
      "Zapier to automate intake → fulfillment",
      "Slack or Telegram for client comms"
    ],
    aiSupport: [
      "Use GPT to write SOPs for each repeatable delivery task",
      "Generate onboarding guides and SOPs for new VAs or freelancers",
      "Create cold email outreach templates for team delegation",
      "Draft internal team meeting agendas and notes"
    ]
  },
  scaling: {
    objective: "Reach consistent £10k/mo+ by compounding clients, referrals, and performance proof.",
    levers: [
      "New UGC and case study every 2 weeks",
      "Upsell high-retainers or add-on services",
      "Referral bonuses",
      "Cold email VA or DM closer added",
      "Replace yourself in sales or delivery"
    ],
    delegation: {
      phase1: ["Creative Editor", "Client Manager", "Lead Gen VA"],
      phase2: ["Sales Closer", "Agency Operator", "Content Strategist"]
    },
    aiSupport: [
      "Use GPT to draft SOPs for onboarding and retention",
      "Write job posts and hiring criteria for closers or editors",
      "Create referral program copy (email, DM, landing page)",
      "Summarize top-performing accounts and suggest upsells"
    ]
  }
};