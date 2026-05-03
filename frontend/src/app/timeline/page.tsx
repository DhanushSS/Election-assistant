import type { Metadata } from 'next';
import { ElectionTimeline } from '@/features/timeline/components/ElectionTimeline';

export const metadata: Metadata = {
  title: 'Election Timeline',
  description:
    'Interactive timeline of the US election process — from candidate filing to official certification. Explore key dates and deadlines.',
};

export default function TimelinePage() {
  return (
    <main id="main-content" style={{ minHeight: '100dvh', background: 'var(--color-surface-base)', paddingTop: '2rem' }}>
      <div className="container">
        <ElectionTimeline />
      </div>
    </main>
  );
}
