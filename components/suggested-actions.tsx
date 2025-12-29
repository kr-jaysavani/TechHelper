"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {

  const suggestedActions = [
    "How do I access TP-Link router admin panel?",
    "Power light is on but no internet light",
    "How do I reset my router?",
    "Diagnose why my Wi-Fi router keeps disconnecting",
    "Why is my internet speed slow?",
    "What do the TP-Link router LED lights mean?",
  // "Help me fix a laptop that won’t turn on",
  // "Guide me through troubleshooting a computer that’s overheating",
  // "Explain the meaning of blinking LEDs on my router",
  // "Help me fix Bluetooth not connecting on Windows",
  // "Troubleshoot a printer that won’t connect to Wi-Fi",
  // "Help me find the cause of random system restarts",
  // "Analyze my desktop setup from this picture",
  // "Tell me how to check if my power supply is working properly",
];
  // const suggestedActions = [
  //   "What are the advantages of using Next.js?",
  //   "Write code to demonstrate Dijkstra's algorithm",
  //   "Help me write an essay about Silicon Valley",
  //   "What is the weather in San Francisco?",
  // ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
