import type { Metadata } from 'next';
import { ElectionTimeline } from '../../components/timeline/ElectionTimeline';
import { Footer } from '../../components/layout/Footer';

export const metadata: Metadata = {
  title: 'Election Timeline',
  description: 'Visual 7-phase guide to the Indian election process — from voter registration to results declaration. Includes Lok Sabha, state election phases, ECI timelines.',
};

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Light-mode header for inner pages */}
      <header className="border-b border-gray-100 px-6 md:px-12 lg:px-16 py-4 bg-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <a href="/" className="text-xl font-semibold text-gray-900" aria-label="VoteAI India home">
            VoteAI India
          </a>
          <a
            href="/assistant"
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Ask Assistant
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <ElectionTimeline />
      </div>

      <Footer />
    </div>
  );
}
