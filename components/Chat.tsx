const handleIndustrySelect = (industry: string) => {
  // Handle the selected industry here
  // For example, send it as a user message
  handleUserMessage(industry);
};

// In your JSX where you want to show the options:
<div className="flex flex-col h-screen">
  <div className="mt-12">
    <div>
      <p className="mb-2">What industries or areas of business excite you the most?</p>
      <IndustryOptions onSelect={handleIndustrySelect} />
    </div>
  </div>
</div> 