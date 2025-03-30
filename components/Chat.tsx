import { useState } from 'react';

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

// Replace or update the current questions logic with:
const initialQuestion = "Do you already know what kind of business you want to build?";

const industryOptions = [
  'Ecommerce',
  'SAAS (Software as a service)',
  'Copywriting',
  'Media Buying'
];

const onboardingQuestions = [
  "What do you really want to build or change in your life?",
  "What's your 1–2 year vision if things go right?",
  "What's your starting point? (money, time, skills)",
  "What's holding you back?",
  "What do you hope I can help you with?"
];

// In your JSX where the questions are displayed:
<div className="flex flex-col h-screen">
  <div className="flex-1 overflow-y-auto">
    {messages.length === 0 && (
      <div className="p-4">
        <p className="mb-4">{initialQuestion}</p>
        <div className="flex flex-col gap-2">
          {industryOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleUserMessage(option)}
              className="p-3 text-left rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
  
  {/* Add spacing above input */}
  <div className="mt-12">
    {/* Your existing input component */}
  </div>
</div> 