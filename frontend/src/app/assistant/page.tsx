import type { Metadata } from 'next';
import { ChatInterface } from '../../components/assistant/ChatInterface';

export const metadata: Metadata = {
  title: 'Ask the Assistant',
  description: 'Chat with VoteAI India — get instant answers about Indian elections, voter registration, ECI, EVMs, and more. Powered by Google Vertex AI Gemini Pro.',
};

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle top bar */}
      <div className="bg-orange-500 h-1" role="presentation" aria-hidden="true" />
      <ChatInterface />
    </div>
  );
}
