export const ecommerceBlueprint = {
  preQualification: {
    description: "Ask 6 questions to understand user's money, time, experience, and skill levels.",
    questions: [
      "How much initial capital can you invest in your ecommerce business?",
      "How much time can you dedicate weekly to running and growing your store?",
      "Do you have any prior experience with ecommerce, dropshipping, or marketing?",
      "How comfortable are you with using digital tools like Shopify, Canva, Meta Ads?",
      "Are you more creative, analytical, or operationally strong?",
      "Are you prepared to invest in ads to test products, even if they don't all succeed?",
      "When do you wish to launch your ecommerce business?"
    ],
    actions: [
      "Score responses to determine suitability",
      "Recommend pivot if misaligned; proceed if determined",
      "Start Stage 1 if score is suitable or user insists on continuing"
    ]
  },
  stage_1: {
    objective: "Find an evergreen, scalable product that solves a real problem or creates clear desire — with strong margin, proof of demand, and branding potential.",
    steps: [
      {
        title: "Customer Persona Research",
        goal: "Define a specific type of person already spending to solve a problem or reach a goal.",
        checklist: [
          "Persona is easy to describe and find online",
          "Experiences a clear pain/desire",
          "Already spending money in the niche",
          "Found on Reddit, TikTok, FB groups, competitor ads"
        ],
        examples: [
          "Men over 30 with chronic back pain",
          "New parents struggling with baby sleep",
          "iPhone content creators frustrated with lighting",
          "College students with acne trying to build confidence"
        ]
      },
      {
        title: "Product Research & Opportunity Filtering",
        goal: "Find in-demand products with potential to grow, not gimmicks.",
        sources: [
          "TikTok Creative Center",
          "Facebook Ads Library",
          "Amazon Movers & Shakers",
          "AliExpress & DSers",
          "Competitor stores via SimilarWeb or myip.ms"
        ],
        validationChecklist: [
          "2–3+ active competitors",
          "Solves pain or triggers desire",
          "Easy to understand",
          "Visually marketable",
          "3x+ markup",
          "COGS ≤ 30%",
          "Shipping < 14 days",
          "Room for brand/angle improvement"
        ],
        redFlags: [
          "Top Amazon/AliExpress listings",
          "Mass-sold on Shopify with no differentiation",
          "Lots of negative ad comments"
        ]
      },
      {
        title: "Financial Fit – Unit Economics",
        rules: [
          "COGS ≤ 30% of price",
          "Minimum 3x markup",
          "Shipping included in COGS if free",
          "$15–$60 retail range for ad efficiency"
        ],
        example: {
          retailPrice: 30,
          COGS: 10,
          breakevenROAS: 1.5
        },
        note: "Avoid products with breakeven ROAS > 2.5"
      },
      {
        title: "Build a Testable Product List",
        instruction: "Create a spreadsheet with 10–20 products. Track supplier, COGS, pricing, demand, angles, UGC potential.",
        tip: "Don't delete weak ideas. Store in a 'Bench' tab for later."
      },
      {
        title: "Build a Brand Concept (Lightweight)",
        requirements: [
          "Simple, short brand name",
          "1-line value proposition",
          "Pick tone (wellness, tech, edgy)",
          "Logo via Canva/AI",
          "Buy .com domain"
        ],
        impact: "Makes your offer feel real, improves conversion & ad creative."
      }
    ],
    pitfalls: [
      "Picking products based on personal taste, not demand",
      "Ignoring unit economics",
      "Copying competitors 1:1",
      "Getting emotionally attached to one idea"
    ],
    deliverables: [
      "Persona with problem/desire",
      "Validated list of 10–20 products",
      "Mapped COGS & pricing",
      "Brand name, logo, and domain",
      "Clear reason why this product should exist"
    ]
  },
  stage_2: {
    objective: "Build a high-converting, product-page-first Shopify store that's simple, fast, and credible — with a refined customer journey.",
    steps: [
      {
        title: "Shopify Setup",
        checklist: [
          "Create a Shopify account using $1/month trial",
          "Use a business email for signup",
          "Don't overthink the store name (can change later)"
        ]
      },
      {
        title: "Domain Purchase & Connection",
        checklist: [
          "Buy domain via Shopify or Namecheap",
          "Use a clean, short .com domain",
          "Avoid generic or hard-to-remember names"
        ],
        examples: {
          good: ["revivenest.com", "postureloop.com"],
          bad: ["mycoolstore-brand.tk", "theshopperplace24.biz"]
        }
      },
      {
        title: "Theme & Branding",
        themes: ["Dawn", "Craft"],
        visualBranding: {
          colors: ["Black (text)", "White (background)", "1 brand color"],
          font: "Use Shopify native fonts",
          nav: "Set header/footer nav and button color"
        }
      },
      {
        title: "Product Page Optimization",
        structure: [
          "Headline with problem + solution",
          "Subheadline with credibility + benefit",
          "Image stack: in-use, lifestyle, infographic",
          "Bullets: 3–5 benefits",
          "Story description: pain → solution → proof → CTA",
          "Offer section with urgency",
          "Trust/guarantee section",
          "Real reviews from TikTok/AliExpress",
          "Sticky Add-to-Cart bar"
        ]
      },
      {
        title: "Cart & Checkout Setup",
        cart: [
          "Use cart drawer instead of cart page",
          "Show summary + discount + shipping"
        ],
        checkout: [
          "Branded checkout with logo and colors",
          "Enable Shopify Payments, PayPal, Apple Pay",
          "Test full flow on mobile/desktop"
        ]
      },
      {
        title: "Fulfillment Setup",
        instruction: "Avoid 3rd-party apps; use direct supplier integration.",
        process: [
          "Source via CJ Dropshipping, AliExpress, TikTok Supplier",
          "Send daily CSV to supplier",
          "Receive tracking CSV and upload with MassFulfill"
        ]
      },
      {
        title: "Klaviyo Email Setup",
        flows: [
          "Welcome popup with 15% offer",
          "Welcome series on signup",
          "Abandoned cart recovery",
          "Order confirmation + shipping updates"
        ]
      },
      {
        title: "Trust Stack",
        mustHaves: [
          "Custom domain",
          "Clean logo",
          "Remove 'Powered by Shopify'",
          "Refund + shipping policy",
          "Testimonials or quotes",
          "Trust badges",
          "Branded checkout"
        ],
        optional: ["Live chat via Shopify Inbox or Tidio"]
      }
    ],
    pitfalls: [
      "Overdesigning homepage",
      "Unoptimized product page",
      "Leaving supplier text unchanged",
      "Too many fonts or colors",
      "Launching before mobile checkout testing",
      "Using 10+ apps too early",
      "Missing email popup"
    ],
    deliverables: [
      "Live Shopify store with custom domain",
      "Optimized product page",
      "Functional cart and checkout",
      "Klaviyo email flows and popup",
      "Mapped fulfillment process"
    ]
  },
  stage_3: {
    objective: "Build scroll-stopping, direct-response-style creatives that convert attention into clicks using a repeatable system.",
    steps: [
      {
        title: "Static Ads",
        benefits: [
          "Fastest to produce",
          "Great for Meta (FB/IG) cold and retargeting",
          "Test angles and offers before video"
        ],
        structure: [
          "Hook headline",
          "Image with product in use",
          "Overlay with CTA"
        ],
        tips: [
          "Use Canva, AI tools, and remove supplier branding",
          "Text must be large and benefit-focused",
          "Avoid product titles as headlines and white-background shots"
        ]
      },
      {
        title: "UGC & Video Ads",
        advantages: [
          "Builds trust and relatability",
          "Feels native to social feeds",
          "Emotional connection"
        ],
        format: [
          "Hook (0–3s)",
          "Demo (3–8s)",
          "Social Proof (8–15s)",
          "Offer + CTA (last 5s)"
        ],
        productionOptions: [
          "CapCut + stock clips + voiceover",
          "TikTok Creative Center",
          "AI tools like Synthesia"
        ]
      },
      {
        title: "Creative Testing & Iteration",
        testingSteps: [
          "ABO campaign with 3–5 ad sets",
          "Use 1 product, 5 creatives",
          "Budget: $15–30 per ad set",
          "Run for 24–48 hours"
        ],
        metrics: {
          CTR: "<1% means weak creative",
          CPC: "> $2 = poor hook",
          CPM: "> $20 = broad competition",
          noSales: "Indicates pricing or trust issue",
          noClicks: "Hook problem"
        },
        iterations: [
          "Make 3 variants of winning creative",
          "Drop price if no sales",
          "Swap hook if no clicks"
        ]
      }
    ],
    deliverables: [
      "3–5 static ads",
      "3–5 UGC video ads",
      "3 hook variations each",
      "Meta ad test structure",
      "Clarity on creative performance"
    ]
  },
  stage_4: {
    objective: "Connect ads, emails, and analytics to track visitors, recover revenue, and monitor key metrics.",
    steps: [
      {
        title: "Meta Business Manager Setup",
        checklist: [
          "Create Business Manager & Ad Account",
          "Create Page with brand logo",
          "Verify domain in Meta"
        ]
      },
      {
        title: "Pixel & Event Setup",
        checklist: [
          "Connect Facebook Pixel in Shopify",
          "Enable Maximum Data Sharing",
          "Test using Events Debug Tool"
        ],
        events: ["ViewContent", "AddToCart", "InitiateCheckout", "Purchase"]
      },
      {
        title: "Klaviyo Email Funnel",
        flows: [
          "Welcome Series (signup popup)",
          "Abandoned Cart",
          "Shipping Confirmation",
          "Thank You Flow"
        ]
      },
      {
        title: "Retargeting Infrastructure",
        audiences: [
          "Website Visitors (7, 30, 90 days)",
          "ViewContent",
          "AddToCart",
          "Instagram/Facebook engagers"
        ],
        notes: "Use lookalikes after 100+ purchases"
      },
      {
        title: "KPI Targets",
        metrics: {
          CTR: "1.5%+",
          CPC: "< $1.50",
          CPM: "< $20",
          ATC_Rate: "5–10%",
          Purchase_Conversion: "1.5–3%",
          Breakeven_ROAS: "1.5–2.0"
        }
      },
      {
        title: "Analytics Setup",
        optional: [
          "Google Analytics 4",
          "Tag Manager",
          "Dashboard in Google Sheets"
        ]
      }
    ],
    deliverables: [
      "Meta account and verified domain",
      "Facebook pixel with working events",
      "Klaviyo synced with store and flows live",
      "Custom audiences built",
      "Core KPIs and ROAS targets"
    ]
  },
  stage_5: {
    objective: "Track daily profits and manage ads to maintain 25%+ net profit with systematic execution.",
    steps: [
      {
        title: "Daily Financial Tracking",
        tools: ["Triple Whale", "TrueProfit"],
        manualTargets: {
          NetProfit: "25%+",
          COGS: "≤ 35%",
          AdSpend: "≤ 45%",
          Tools: "≤ 5%",
          Refunds: "≤ 3%"
        }
      },
      {
        title: "Midday Ads Management",
        window: "12–2pm ad account time",
        rules: [
          "CUT if ROAS < target",
          "SCALE if ROAS > target + 0.2 (3 days)",
          "DOUBLE if ROAS > target + 0.7 and $600+ spend"
        ]
      }
    ],
    deliverables: [
      "Real-time profit tracking dashboard",
      "Manual P&L morning review",
      "Midday ad decisions system",
      "Clear ROAS cut/scale rules"
    ]
  },
  scaling: {
    objective: "Scale beyond $1k/day with optimized margin, CAC, and systems for growth.",
    levers: [
      {
        title: "Positive Cash Flow",
        actions: [
          "Use Triple Whale/TrueProfit",
          "Increase AOV (bundles, upsells)",
          "Stretch supplier terms"
        ]
      },
      {
        title: "New Product Rollouts",
        actions: [
          "Maintain Product Pipeline",
          "Launch new SKU every 2–3 weeks",
          "Reuse existing store and pixel"
        ]
      },
      {
        title: "Customer Experience",
        actions: [
          "Ship in 7–10 days or local 2-day",
          "Respond to emails < 4h",
          "Send tracking and usage tips"
        ]
      },
      {
        title: "More Creatives",
        actions: [
          "Launch 1 new creative daily",
          "Rotate formats and hooks",
          "Target new personas"
        ]
      },
      {
        title: "New Channels & Territories",
        actions: [
          "Expand to Google, TikTok, Spark Ads",
          "New markets: UK, CA, AUS, DE, NL, UAE"
        ]
      },
      {
        title: "Economies of Scale",
        actions: [
          "Negotiate lower COGS",
          "Use warehouses or 3PL",
          "Bulk purchase proven products"
        ]
      }
    ],
    founderFocus: [
      "Profit",
      "Product",
      "Customer Experience",
      "Creative Engine",
      "Market Expansion"
    ],
    delegation: {
      phase1: ["Creative Manager", "Media Buyer", "CX/Fulfillment Operator"],
      phase2: ["Shopify Manager", "Product Researcher", "Bookkeeper", "Executive Assistant"]
    },
    testing: [
      "Price",
      "Creative hooks",
      "Page layout",
      "Bundles",
      "CTAs",
      "Urgency copy"
    ],
    deliverables: [
      "Scalable profit systems",
      "Creative and product testing engine",
      "Delegated core roles",
      "Clear focus priorities for founder"
    ]
  }
};
