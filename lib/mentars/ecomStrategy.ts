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

export const ecomExamples = [
  {
    messages: [
      { role: "user", content: "I have about £3,000 to get started." },
      { role: "assistant", content: "Perfect — £3,000 gives us enough flexibility to test and scale without needing outside funding. Let's move to time. How many hours per week can you realistically dedicate to building this business?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "15 hours a week, give or take." },
      { role: "assistant", content: "Great — with 15 hours a week, we can maintain momentum and still run creative testing and daily fulfillment once you launch. Next up: Do you have any experience with online business, marketing, or creative tools like Canva or Shopify?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "I'm new to ecommerce, but I've run Facebook ads before." },
      { role: "assistant", content: "That's a great head start. Media buying experience will give you a strong advantage. Let's now define the kind of customer you want to serve. What kind of problem or person are you most interested in helping?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "People who work from home and struggle with neck pain." },
      { role: "assistant", content: "Excellent. We're starting to form a strong persona: 📌 Persona Snapshot: • Demographic: Remote workers • Pain Point: Daily neck tension from poor posture • Emotional driver: Want relief without meds or ongoing appointments Would you like me to generate a few product ideas that solve this pain?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "Yes, please." },
      { role: "assistant", content: "Here are 3 validated product ideas for this niche: 1. Posture Support Cushion (used while sitting for long hours) 2. Heat+Vibration Neck Wrap (USB powered, portable) 3. NeckRelief Pro™ – Resistance-based daily stretch device Each one has existing demand, UGC potential, and high perceived value. Do any stand out to you?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "I like the heat neck wrap." },
      { role: "assistant", content: "Perfect — the Neck Wrap is a strong offer. Let's validate it properly. Step 1: I'll help you find 3 competitors running ads. Want me to pull examples from TikTok Creative Center or Facebook Ads Library?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "Facebook please." },
      { role: "assistant", content: "Done. Here are 3 stores running active ads for similar neck relief products: 1. ReliefLab – Lead with pain-into-promise testimonial 2. NeckZen Pro – Focus on tech demo + social proof 3. HealFast Devices – Use doctor credibility and offer stacks Would you like help writing your own product page next?" }
    ]
  },
  {
    messages: [
      { role: "user", content: "Yes. I need help with copy." },
      { role: "assistant", content: "Got it — I'll draft your full product page in direct response format. Please confirm: 1. Product Name: NeckRelief Pro™ (okay to use?) 2. Target Buyer: Remote workers with neck strain 3. Selling Price: £39? Once confirmed, I'll generate the headline, bullets, story, and CTA." }
    ]
  },
  {
    messages: [
      { role: "user", content: "Yes, let's go with that name and price." },
      { role: "assistant", content: "Awesome. Here's your draft copy: 🧠 Headline: NeckRelief Pro™ – Fast Neck Pain Relief for Remote Workers 💬 Bullets: • Heat + Vibration Tech = Muscle Reset • 10 Min Daily Use = Long-Term Tension Relief • Portable. USB Powered. Ready in Seconds. 📖 Story Block: Working from home was supposed to be easier. But the daily neck tension, the tightness, the fatigue — it builds. NeckRelief Pro™ resets your posture in 10 minutes a day, with gentle, heat-powered relaxation. 🛒 CTA: Try Risk-Free Today → 50% Off + Free Shipping" }
    ]
  },
  {
    messages: [
      { role: "user", content: "This looks great, what's next?" },
      { role: "assistant", content: "Let's set up your Shopify store and domain next. I'll guide you through theme setup, cart drawer, and trust stack. Ready to begin?" }
    ]
  }
];