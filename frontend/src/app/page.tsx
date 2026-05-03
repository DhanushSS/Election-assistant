import type { Metadata } from 'next';
import { HeroSection } from '../components/hero/HeroSection';
import { ElectionTimeline } from '../components/timeline/ElectionTimeline';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { Footer } from '../components/layout/Footer';
import { ECI_INFO, ELECTION_FACTS } from '../lib/constants/india-elections';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VoteAI India — Your Guide to Indian Elections',
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* How to Vote Section */}
      <section
        id="how-to-vote"
        className="py-20 px-6 md:px-12 lg:px-16 bg-white"
        aria-labelledby="how-to-vote-heading"
      >
        <ScrollReveal>
          <h2 id="how-to-vote-heading" className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3 text-center">
            How to Vote in India
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
            Everything you need to know about exercising your democratic right.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              step: '01',
              title: 'Register as a Voter',
              desc: 'Fill Form 6 on voters.eci.gov.in or visit your Booth Level Officer (BLO). Minimum age 18.',
              icon: '📋',
            },
            {
              step: '02',
              title: 'Get Your EPIC Card',
              desc: "Receive your Electors' Photo Identity Card (Voter ID). Keep it safe — you'll need it on polling day.",
              icon: '🪪',
            },
            {
              step: '03',
              title: 'Cast Your Vote',
              desc: 'Go to your assigned polling booth. Press the EVM button next to your candidate. VVPAT confirms your vote.',
              icon: '🗳️',
            },
          ].map((item, idx) => (
            <ScrollReveal key={item.step} delay={idx * 100}>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3" aria-hidden="true">{item.icon}</div>
                <div className="text-xs font-bold text-orange-500 mb-1 uppercase tracking-widest">Step {item.step}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Timeline Preview */}
      <div className="bg-gray-50" id="timeline-preview">
        <ElectionTimeline />
      </div>

      {/* ECI Info Section */}
      <section
        id="eci-info"
        className="py-16 px-6 md:px-12 lg:px-16 bg-white"
        aria-labelledby="eci-info-heading"
      >
        <ScrollReveal>
          <h2 id="eci-info-heading" className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Election Commission of India
          </h2>
        </ScrollReveal>

        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          <ScrollReveal delay={0}>
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-3">Key Facts</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Established</dt>
                  <dd className="font-medium text-gray-900">{ECI_INFO.established}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Constitutional basis</dt>
                  <dd className="font-medium text-gray-900">{ECI_INFO.constitution}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lok Sabha Seats</dt>
                  <dd className="font-medium text-gray-900">{ELECTION_FACTS.lokSabha.seats}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Majority needed</dt>
                  <dd className="font-medium text-gray-900">{ELECTION_FACTS.lokSabha.majorityNeeded}+</dd>
                </div>
              </dl>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3">Useful Links</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'ECI Official Portal', href: ECI_INFO.website },
                  { label: 'Voter Registration', href: ECI_INFO.voterPortal },
                  { label: 'Election Results', href: ECI_INFO.resultsPortal },
                ].map(link => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
                <li className="pt-1 border-t border-blue-200">
                  <span className="text-gray-700 font-medium">Voter Helpline: </span>
                  <a href="tel:1950" className="text-blue-600 font-bold hover:underline">1950</a>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Banner */}
      <ScrollReveal>
        <section className="py-16 px-6 text-center bg-orange-500" aria-label="Call to action">
          <h2 className="text-3xl font-bold text-white mb-3">Have a question about elections?</h2>
          <p className="text-white/80 mb-6 text-base">
            Ask VoteAI India — powered by Google Vertex AI Gemini Pro
          </p>
          <Link
            href="/assistant"
            className="inline-block bg-white text-orange-600 font-semibold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors"
            aria-label="Open election assistant"
          >
            Ask the Assistant →
          </Link>
        </section>
      </ScrollReveal>

      <Footer />
    </>
  );
}
