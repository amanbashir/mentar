export const softwareBlueprint = {
  preQualification: {
    description: "Evaluate if the user is a good fit for building a SaaS business.",
    questions: [
      "Do you want to build once and earn long-term recurring income?",
      "Are you comfortable validating ideas before building anything?",
      "Do you have basic tech skills or are willing to learn how to use AI tools to speed up dev?",
      "Are you ready to be patient (6–12 months) and consistent?",
      "Do you want to solve a real pain point — not just chase trends?",
      "When do you wish to launch your software business?"
    ],
    guidance: "If YES to most, proceed. If not, consider simpler digital products or services."
  },

  stage_1: {
    objective: "Use AI tools and market signals to generate and validate a high-potential SaaS idea.",
    steps: [
      {
        title: "Competitive Research (Pre-MVP)",
        tools: ["Product Hunt", "G2", "Capterra", "BuiltWith"],
        analysis: ["Pricing", "Reviews for pain points", "Gaps or missing features"],
        aiPrompt: "Compare [your idea] to [competitor] and find gaps"
      },
      {
        title: "Idea Generation Using AI",
        tools: ["ChatGPT", "Claude", "FutureTools.io", "There's An AI For That", "Google Trends", "ExplodingTopics.com"],
        outcome: "10 SaaS ideas in underserved or trending categories"
      },
      {
        title: "Validate with Search + Social Signals",
        platforms: ["Reddit", "Twitter", "YouTube", "Quora"],
        strategy: "Look for frustrations, 'tool for…', competitor comment gaps"
      },
      {
        title: "Build a One-Sentence Offer",
        template: "This SaaS helps [target user] solve [pain point] by doing [outcome] automatically.",
        validation: ["ChatGPT", "Twitter/X feedback", "Reddit/Discord testing"],
        greenlight: "Proceed if 2–3 people say 'I’d pay for that'"
      }
    ]
  },

  stage_2: {
    objective: "Build a working MVP in 7–30 days using no-code and AI tools.",
    tools: {
      frontend: ["Windsurf", "Cursor", "Lovable"],
      backend: ["Zapier", "Make", "Bardeen", "Pipedream"],
      database: ["Airtable", "Supabase"],
      ai: {
        logic: ["ChatGPT API", "Claude API"],
        voice: ["Whisper", "AssemblyAI"],
        image: ["Stability AI", "Replicate"]
      }
    },
    productTypes: [
      "GPT agent tools (e.g., AI summarizers, planners)",
      "Dashboards (reports, analytics)",
      "Niche automators (resumes, invoices)",
      "Chrome extensions or embedded widgets"
    ],
    checklist: [
      "Test 10+ edge cases",
      "Share with 3–5 users",
      "Fix friction",
      "MVP should solve one clear problem with minimal clicks"
    ]
  },

  stage_3: {
    objective: "Set up a SaaS landing page, collect leads, and create feedback loops.",
    tools: {
      website: ["Framer", "Typedream", "Carrd"],
      forms: ["Tally", "Typeform"]
    },
    landingPage: {
      sections: ["Hero", "Demo (Loom or GIF)", "Waitlist form", "Social proof"]
    },
    feedbackLoop: [
      "In-app feedback form",
      "Email survey: What did you like? What’s missing?",
      "Reward users for bugs/feedback (e.g., credits, discounts)"
    ]
  },

  stage_4: {
    objective: "Use organic and compounding channels to get your first 100–1,000 users.",
    strategies: [
      {
        title: "Build in Public",
        channels: ["Twitter/X", "LinkedIn", "YouTube Shorts"],
        content: ["MVP launch", "Feature updates", "User feedback"],
        tip: "Always include a CTA to your link"
      },
      {
        title: "Educational Content",
        formats: ["Weekly YouTube videos", "Twitter threads"],
        promptIdeas: "How to [solve problem] using AI",
        aiSupport: "Use ChatGPT to brainstorm scripts and headlines"
      },
      {
        title: "Community Seeding",
        platforms: ["Indie Hackers", "Reddit", "Discord/Slack", "AI newsletters like Toolify, FutureTools"]
      },
      {
        title: "Early User Incentives",
        offers: [
          "Lifetime deal for first 100 users",
          "Free access for beta testers who provide feedback",
          "Launch giveaways (e.g., $500 tool stack)"
        ]
      }
    ],
    goal: "1,000 email signups or 100 active users in 30–60 days"
  },

  stage_5: {
    objective: "Convert early users into paying customers and start optimizing key SaaS metrics.",
    monetization: {
      tools: ["Stripe", "LemonSqueezy", "Gumroad"],
      pricingModels: [
        "Free forever with feature limits",
        "$9–$29/month starter",
        "$99+/month pro/agency plan"
      ]
    },
    keyMetrics: {
      dailyActiveUsers: "100+",
      churnRate: "< 7%",
      activationRate: "> 30%",
      conversionToPaid: "5–15%",
      ltvToCacRatio: "3:1"
    },
    optimization: [
      "Use Hotjar or Clarity for session tracking",
      "Live chat via Tawk.to or Crisp",
      "Send monthly feedback surveys",
      "Release frequent updates and fixes"
    ]
  },

  stage_6: {
    objective: "Scale your SaaS sustainably with better ops, faster iteration, and small team.",
    levers: [
      "SEO blog content + backlinks (10 high-intent posts)",
      "Referral program: 1 month free per referral",
      "Cold email via Clay + Instantly",
      "Paid ads (retarget visitors, sponsor newsletters)"
    ],
    hiring: [
      "VA for support and outreach",
      "Developer to replace no-code stack",
      "Content creator for videos and social"
    ],
    systems: {
      dashboard: ["Notion", "Airtable"],
      elements: ["Feedback log", "Feature roadmap", "User insights", "Revenue tracking"]
    },
    legal: {
      tools: ["Termly", "GetTerms", "Stripe Tax", "Paddle"],
      requirements: ["GDPR compliance", "Privacy Policy", "Cookie banners"]
    },
    customerSuccess: [
      "Welcome flow via ConvertKit or Loops",
      "Onboarding with Userflow or Loom",
      "Help center with Notion or HelpKit"
    ],
    optimization: [
      "A/B test onboarding, pricing, CTA",
      "Use Google Optimize or Splitbee",
      "Bi-weekly metric reviews"
    ]
  }
};
