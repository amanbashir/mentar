import React, { useState } from "react";
import { MentarService } from "../lib/services/mentarService";
import { UserProfile } from "../types/mentar";

interface ChatProps {
  currentProfile: UserProfile;
  messages: Array<{ role: string; content: string }>;
  onMessageSend: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  currentProfile,
  messages,
  onMessageSend,
}) => {
  const handleUserMessage = async (message: string) => {
    if (!currentProfile) return;
    onMessageSend(message);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {/* Message display logic will be handled by parent component */}
      </div>

      {/* Add spacing above input */}
      <div className="mt-12">
        {/* Input component will be handled by parent component */}
      </div>
    </div>
  );
};

export default Chat;
