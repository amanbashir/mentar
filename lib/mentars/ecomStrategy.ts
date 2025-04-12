export const ecomStrategy = {
  stage_1: {
    objective: "Find an evergreen, scalable product with strong margin, proof of demand, and clear customer persona.",
    checklist: [
      "3+ competitors running ads",
      "Solves clear pain or desire",
      "Easy to understand without explanation",
      "Visually marketable (UGC/demos)",
      "3x+ markup",
      "COGS ≤ 30% of price",
      "Reasonable shipping time (<14 days)",
      "Not oversaturated"
    ],
    aiSupport: [
      "Use GPT to draft 3 potential customer personas based on niche",
      "Generate 10 product name ideas with positioning",
      "Summarize top 3 competitors with their strengths/weaknesses",
      "Brainstorm 5 product angles and UGC hooks"
    ]
  },
  stage_2: {
    objective: "Build a general niche store optimized for direct-response traffic with a fully built product page.",
    checklist: [
      "Product page copy (headline, bullets, story, CTA) written",
      "Cart drawer enabled",
      "Checkout tested with branding + trust",
      "Email popup active with 15% offer",
      "Post-purchase upsell live",
      "Supplier confirmed with daily fulfillment"
    ],
    aiSupport: [
      "Use GPT to write product page: headline, bullets, benefits, guarantee",
      "Generate FAQ and trust badge text based on objections",
      "Create urgency copy (limited stock, 24h discount)",
      "Write 3 different CTA button texts to test"
    ]
  },
  stage_3: {
    objective: "Build high-performance creative assets for Meta and TikTok. Test 15–30 variations across 3 angles.",
    checklist: [
      "3–5 static ads live",
      "3–5 UGC-style video ads",
      "3+ unique hook styles",
      "Daily creative rotation in place"
    ],
    aiSupport: [
      "Use GPT to write hook headlines for static ads",
      "Generate UGC script templates for testimonials and demo",
      "Rewrite poor-performing ad copy with new angle",
      "Draft 3 video hooks with pain > promise format"
    ]
  },
  stage_4: {
    objective: "Launch Meta ad funnel with tracking, flows, and measurement systems.",
    checklist: [
      "Meta BM setup",
      "Pixel firing on VC, ATC, IC, PUR",
      "Attribution window set (7-day click, 1-day view)",
      "Email flows created in Klaviyo",
      "Retargeting audiences built",
      "KPI benchmarks set"
    ],
    aiSupport: [
      "Use GPT to write Klaviyo welcome sequence and abandoned cart copy",
      "Draft warm retargeting ad copy (testimonials, urgency)",
      "Build ad angles for Top 3 cold personas"
    ]
  },
  stage_5: {
    objective: "Track daily profit, manage ad performance, iterate creatives.",
    checklist: [
      "Triple Whale / TrueProfit installed",
      "Manual P&L tracked",
      "Midday cut + scale SOP followed",
      "New ad launched daily",
      "CSV sent nightly for fulfillment"
    ],
    aiSupport: [
      "Summarize ad set performance and flag underperformers",
      "Suggest new offers or bundle ideas to increase AOV",
      "Write creative refresh hooks for fatigued winners"
    ]
  },
  stage_6: {
    objective: "Systemize backend, support, and margin optimization.",
    checklist: [
      "Daily ops checklist completed",
      "Support response time < 4hr",
      "Refund rate < 3%",
      "SOPs built for support + fulfillment",
      "Profit dashboard reviewed daily"
    ],
    aiSupport: [
      "Use GPT to write refund email templates",
      "Generate SOPs for supplier coordination + creative handoff",
      "Suggest margin boosters: price, bundle, shipping"
    ]
  },
  scaling: {
    objective: "Scale from £1k/day to £10k/day while protecting net profit.",
    levers: [
      "Positive cash flow system",
      "New product every 2–3 weeks",
      "Daily creative testing",
      "Lower CAC via better hooks/angles",
      "3PL setup for core GEOs"
    ],
    delegation: {
      phase1: ["Creative Operator", "Media Buyer", "CX VA"],
      phase2: ["Shopify Manager", "Product Tester", "Bookkeeper"]
    },
    aiSupport: [
      "Draft hiring briefs and role descriptions for freelancers",
      "Use GPT to suggest new hooks based on scaling audience",
      "Generate bundle/offer variations to test AOV improvement"
    ]
  }
};