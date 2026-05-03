'use client';

import { useState } from 'react';
import styles from './page.module.css';

export interface ElectionTimelineStep {
  id: string;
  title: string;
  date: string | null;
  description: string;
  isDeadline: boolean;
  status?: 'past' | 'current' | 'upcoming';
}

const US_GENERAL_ELECTION_TIMELINE: ElectionTimelineStep[] = [
  {
    id: 'candidate-filing',
    title: 'Candidate Filing Deadline',
    date: 'Varies by state',
    description: 'Last day for candidates to file paperwork to appear on the ballot. Typically 60-90 days before the primary.',
    isDeadline: true,
    status: 'past',
  },
  {
    id: 'voter-reg',
    title: 'Voter Registration Deadline',
    date: '15-30 days before election',
    description: 'Last day to register to vote in most states. Some states offer same-day registration at the polls.',
    isDeadline: true,
    status: 'upcoming',
  },
  {
    id: 'early-voting',
    title: 'Early Voting Period',
    date: 'Varies by state (1-45 days before)',
    description: 'Many states allow voting before Election Day at designated early voting locations. No absentee ballot needed.',
    isDeadline: false,
    status: 'upcoming',
  },
  {
    id: 'mail-ballot-request',
    title: 'Mail Ballot Request Deadline',
    date: '7-14 days before election',
    description: 'Final date to request a mail-in or absentee ballot from your county election office.',
    isDeadline: true,
    status: 'upcoming',
  },
  {
    id: 'election-day',
    title: 'Election Day',
    date: 'First Tuesday after first Monday in November',
    description: 'The primary federal election day. Polls typically open 6am-7am and close at 7pm-8pm local time.',
    isDeadline: false,
    status: 'upcoming',
  },
  {
    id: 'provisional-ballot',
    title: 'Provisional Ballot Period',
    date: 'Election Day + up to 7 days',
    description: 'Voters who face issues at the polls can cast provisional ballots, which are verified after Election Day.',
    isDeadline: false,
    status: 'upcoming',
  },
  {
    id: 'canvass',
    title: 'Official Canvass',
    date: 'Varies by state (7-30 days after)',
    description: 'State officials count all ballots, including mail-in and provisional. Results become official.',
    isDeadline: false,
    status: 'upcoming',
  },
  {
    id: 'certification',
    title: 'Election Certification',
    date: 'Varies by state (30-45 days after)',
    description: 'The official certification of election results by the state. Winners are formally declared.',
    isDeadline: true,
    status: 'upcoming',
  },
];

interface ElectionTimelineProps {
  steps?: ElectionTimelineStep[];
  onStepClick?: (step: ElectionTimelineStep) => void;
}

export function ElectionTimeline({
  steps = US_GENERAL_ELECTION_TIMELINE,
  onStepClick,
}: ElectionTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleStepClick = (step: ElectionTimelineStep) => {
    setActiveId(step.id === activeId ? null : step.id);
    onStepClick?.(step);
  };

  const handleKeyDown = (e: React.KeyboardEvent, step: ElectionTimelineStep) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStepClick(step);
    }
  };

  return (
    <section className={styles.timelineSection} aria-label="Election timeline">
      <div className={styles.timelineHeader}>
        <h2 className={styles.timelineTitle}>Election Timeline</h2>
        <p className={styles.timelineSubtitle}>
          Key dates and milestones in the election process. Click any step to learn more.
        </p>
      </div>

      {/* Scrollable timeline track */}
      <div
        className={styles.timelineWrapper}
        role="list"
        aria-label="Election process timeline steps"
      >
        <div className={styles.timelineTrack}>
          {/* Progress line */}
          <div className={styles.progressLine} aria-hidden="true" />

          {steps.map((step, index) => (
            <div
              key={step.id}
              role="listitem"
              className={`${styles.timelineNode} ${
                step.status === 'past' ? styles.nodePast : ''
              } ${activeId === step.id ? styles.nodeActive : ''} ${
                hoveredId === step.id ? styles.nodeHovered : ''
              } ${step.isDeadline ? styles.nodeDeadline : ''}`}
            >
              {/* Connector dot */}
              <div
                className={styles.nodeDot}
                aria-hidden="true"
              />

              {/* Step number */}
              <div className={styles.nodeNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Card */}
              <button
                className={styles.nodeCard}
                onClick={() => handleStepClick(step)}
                onKeyDown={e => handleKeyDown(e, step)}
                onMouseEnter={() => setHoveredId(step.id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-expanded={activeId === step.id}
                aria-label={`${step.title}${step.isDeadline ? ' (deadline)' : ''}. ${step.date ?? ''}. Click to ${activeId === step.id ? 'collapse' : 'expand'} details.`}
              >
                <div className={styles.nodeCardHeader}>
                  {step.isDeadline && (
                    <span className={`badge badge--warning ${styles.deadlineBadge}`} aria-label="Deadline">
                      <span aria-hidden="true">⏰</span> Deadline
                    </span>
                  )}
                  <h3 className={styles.nodeTitle}>{step.title}</h3>
                  {step.date && (
                    <time className={styles.nodeDate} dateTime="">
                      {step.date}
                    </time>
                  )}
                </div>

                {/* Expanded description */}
                {activeId === step.id && (
                  <div
                    className={styles.nodeDescription}
                    role="region"
                    aria-label={`Details for ${step.title}`}
                  >
                    <p>{step.description}</p>
                    <button
                      className={`btn btn-primary ${styles.askBtn}`}
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/assistant?q=${encodeURIComponent(`Tell me more about ${step.title}`)}`;
                      }}
                      aria-label={`Ask the AI assistant about ${step.title}`}
                    >
                      Ask AI about this step →
                    </button>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <p className={styles.scrollHint} aria-hidden="true">
        ← Scroll to explore all steps →
      </p>
    </section>
  );
}
