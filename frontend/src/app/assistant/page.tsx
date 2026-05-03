import type { Metadata } from 'next';
import { ChatInterface } from '../../components/assistant/ChatInterface';

export const metadata: Metadata = {
  title: 'Ask the Assistant',
  description: 'Ask VoteAI India anything about Indian elections — voter registration, Lok Sabha, EVMs, Model Code of Conduct, and more. Powered by Google Gemini.',
};

export default function AssistantPage() {
  return <ChatInterface />;
}
