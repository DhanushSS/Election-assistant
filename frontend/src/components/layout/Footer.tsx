'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-10 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">VoteAI India</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by Google Vertex AI · For informational purposes only
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-gray-500" aria-label="Footer navigation">
          <Link href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 transition-colors">
            ECI Official
          </Link>
          <Link href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 transition-colors">
            Voter Registration
          </Link>
          <Link href="/timeline" className="hover:text-gray-800 transition-colors">Timeline</Link>
          <Link href="/assistant" className="hover:text-gray-800 transition-colors">Ask Assistant</Link>
        </nav>
        <p className="text-xs text-gray-400">Voter Helpline: <strong className="text-gray-600">1950</strong></p>
      </div>
    </footer>
  );
}
