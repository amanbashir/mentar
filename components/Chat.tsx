const handleIndustrySelect = (industry: string) => {
  // Handle the selected industry here
  // For example, send it as a user message
  handleUserMessage(industry);
};

const handleUserMessage = async (message: string) => {
  if (!currentProfile) return;

  const userMessage = { role: 'user', content: message };
  
  // If this is the first message or no business type is set
  if (!currentProfile.businessType) {
    const response = await MentarService.handleOnboarding(message, currentProfile);
    // Update UI with response
    return;
  }

  const mentarResponse = await MentarService.startMentarChat(
    [...messages, userMessage],
    currentProfile
  );
  
  // Update UI with response
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