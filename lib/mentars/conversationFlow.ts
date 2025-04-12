export const conversationFlow = {
  ecommerce: {
  stage_0: ["budget", "time", "experience", "skill", "goalIncome", "salesComfort", "contentComfort", "businessReason"],
  stage_1: ["persona", "productIdeas", "competitorCheck", "COGS", "price", "breakevenROAS", "brandAngle", "domain"],
  stage_2: ["shopifySetup", "domainConnected", "themeInstalled", "productPageBuilt", "checkoutTested", "emailPopUpLive", "supplierConfirmed"],
  stage_3: ["staticAds", "videoAds", "hookTesting", "creativeRotation", "commentMonitoring"],
  stage_4: ["metaSetup", "pixelTracking", "emailFlows", "retargetingSetup", "KPISetup"],
  stage_5: ["P&LTracking", "middayAdReview", "scalingRules", "creativeIteration", "commentControl"],
  stage_6: ["supplierLoop", "supportSOP", "localFulfillment", "marginTracking", "refundRateCheck"],
  scaling: ["productPipeline", "AOVStrategy", "CACStrategy", "geoExpansion", "delegationSetup"]
  },
  agency: {
    stage_0: ["agencyType", "agencySize", "agencyExperience", "agencySkill", "agencyGoalIncome", "agencySalesComfort", "agencyContentComfort", "agencyBusinessReason"],
    stage_1: ["agencyPersona", "agencyProductIdeas", "agencyCompetitorCheck", "agencyCOGS", "agencyPrice", "agencyBreakevenROAS", "agencyBrandAngle", "agencyDomain"],
    stage_2: ["agencyShopifySetup", "agencyDomainConnected", "agencyThemeInstalled", "agencyProductPageBuilt", "agencyCheckoutTested", "agencyEmailPopUpLive", "agencySupplierConfirmed"],
    stage_3: ["agencyStaticAds", "agencyVideoAds", "agencyHookTesting", "agencyCreativeRotation", "agencyCommentMonitoring"],
  },
  saas: {
    stage_0: ["budget", "time", "experience", "skill", "goalIncome", "salesComfort", "contentComfort", "businessReason"],
    stage_1: ["saasIdea", "targetMarket", "competitorCheck", "pricingModel", "mrrGoal", "breakevenPoint", "brandAngle", "domain"],
    stage_2: ["landingPageSetup", "domainConnected", "themeInstalled", "productPageBuilt", "checkoutTested", "emailPopUpLive", "productDemoCreated"],
    stage_3: ["contentStrategy", "seoSetup", "socialMedia", "emailMarketing", "communityBuilding"],
    stage_4: ["analyticsSetup", "userTracking", "emailFlows", "retargetingSetup", "KPISetup"],
    stage_5: ["pricingOptimization", "userFeedback", "scalingRules", "featureRoadmap", "supportSystem"],
    stage_6: ["teamHiring", "supportSOP", "localOperations", "marginTracking", "churnRateCheck"],
    scaling: ["productPipeline", "AOVStrategy", "CACStrategy", "geoExpansion", "delegationSetup"]
  },
  copywriting: {
    stage_0: ["budget", "time", "experience", "skill", "goalIncome", "salesComfort", "contentComfort", "businessReason"],
    stage_1: ["copywritingNiche", "targetMarket", "competitorCheck", "pricingModel", "mrrGoal", "breakevenPoint", "brandAngle", "portfolio"],
    stage_2: ["websiteSetup", "domainConnected", "themeInstalled", "servicePageBuilt", "contactFormTested", "emailPopUpLive", "portfolioCreated"],
    stage_3: ["contentStrategy", "seoSetup", "socialMedia", "emailMarketing", "communityBuilding"],
    stage_4: ["analyticsSetup", "clientTracking", "emailFlows", "retargetingSetup", "KPISetup"],
    stage_5: ["pricingOptimization", "clientFeedback", "scalingRules", "serviceRoadmap", "supportSystem"],
    stage_6: ["teamHiring", "supportSOP", "localOperations", "marginTracking", "clientRetentionCheck"],
    scaling: ["servicePipeline", "AOVStrategy", "CACStrategy", "geoExpansion", "delegationSetup"]
  }
};