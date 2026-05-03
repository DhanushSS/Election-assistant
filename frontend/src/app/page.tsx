'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import styles from './page.module.css';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
];

type WizardStep = 1 | 2 | 3;

export default function HomePage() {
  const { user, isLoading, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto-detect region from browser locale
  useEffect(() => {
    const locale = navigator.language;
    const region = locale.split('-')[1];
    if (region) {
      const match = COUNTRIES.find(c => c.code === region.toUpperCase());
      if (match) setSelectedCountry(match.code);
    }
    const lang = locale.split('-')[0] ?? 'en';
    const matchedLang = LANGUAGES.find(l => l.code === lang);
    if (matchedLang) setSelectedLanguage(matchedLang.code);
  }, []);

  // Redirect to assistant if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/assistant');
    }
  }, [user, isLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      router.push('/assistant');
    } catch {
      setAuthError('Google sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInAsGuest();
      router.push('/assistant');
    } catch {
      setAuthError('Could not start guest session. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading} aria-label="Loading application">
        <div className="spinner" role="status" aria-live="polite" aria-label="Loading" />
      </div>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      {/* Background gradient blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={styles.heroGrid}>
        {/* Left: Branding */}
        <div className={styles.heroBrand}>
          <div className={styles.badge} role="img" aria-label="Powered by Google Vertex AI">
            <span className={styles.badgeDot} aria-hidden="true" />
            Powered by Google Vertex AI
          </div>
          <h1 className={styles.heroTitle}>
            Your Civic{' '}
            <span className={styles.heroAccent}>AI Guide</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Navigate every step of the election process — registration, timelines,
            voting procedures — with AI assistance grounded in real-time data.
          </p>
          <div className={styles.heroStats} aria-label="Key statistics">
            <div className={styles.stat}>
              <span className={styles.statNumber}>195+</span>
              <span className={styles.statLabel}>Countries</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}>
              <span className={styles.statNumber}>20+</span>
              <span className={styles.statLabel}>Languages</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}>
              <span className={styles.statNumber}>Real-time</span>
              <span className={styles.statLabel}>AI Answers</span>
            </div>
          </div>
        </div>

        {/* Right: Onboarding Wizard */}
        <div className={styles.wizardCard} role="region" aria-label="Getting started wizard">
          {/* Step indicator */}
          <div className={styles.stepIndicator} role="list" aria-label="Setup steps">
            {([1, 2, 3] as const).map(n => (
              <div
                key={n}
                role="listitem"
                aria-current={step === n ? 'step' : undefined}
                className={`${styles.stepDot} ${step >= n ? styles.stepDotActive : ''} ${step === n ? styles.stepDotCurrent : ''}`}
                aria-label={`Step ${n}${step > n ? ', completed' : step === n ? ', current' : ''}`}
              />
            ))}
          </div>

          {/* Step 1: Country */}
          {step === 1 && (
            <div className={styles.wizardStep} key="step1">
              <h2 className={styles.wizardTitle}>Select Your Country</h2>
              <p className={styles.wizardDesc}>
                We&apos;ll tailor election information to your jurisdiction.
              </p>
              <div className={styles.optionGrid} role="radiogroup" aria-label="Country selection">
                {COUNTRIES.map(country => (
                  <button
                    key={country.code}
                    role="radio"
                    aria-checked={selectedCountry === country.code}
                    className={`${styles.optionBtn} ${selectedCountry === country.code ? styles.optionBtnSelected : ''}`}
                    onClick={() => setSelectedCountry(country.code)}
                  >
                    <span className={styles.optionFlag} aria-hidden="true">{country.flag}</span>
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div className={styles.wizardStep} key="step2">
              <h2 className={styles.wizardTitle}>Choose Your Language</h2>
              <p className={styles.wizardDesc}>
                Get election information in your preferred language.
              </p>
              <div className={styles.langGrid} role="radiogroup" aria-label="Language selection">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    role="radio"
                    aria-checked={selectedLanguage === lang.code}
                    className={`${styles.langBtn} ${selectedLanguage === lang.code ? styles.langBtnSelected : ''}`}
                    onClick={() => setSelectedLanguage(lang.code)}
                  >
                    <span className={styles.langName}>{lang.name}</span>
                    <span className={styles.langNative}>{lang.native}</span>
                  </button>
                ))}
              </div>
              <div className={styles.wizardNav}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Sign In */}
          {step === 3 && (
            <div className={styles.wizardStep} key="step3">
              <h2 className={styles.wizardTitle}>Get Started</h2>
              <p className={styles.wizardDesc}>
                Sign in to save your conversations and preferences.
              </p>

              {authError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={styles.errorAlert}
                >
                  <span aria-hidden="true">⚠</span> {authError}
                </div>
              )}

              <div className={styles.signInOptions}>
                <button
                  className={`${styles.googleBtn} btn`}
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  aria-busy={isSigningIn}
                >
                  {isSigningIn ? (
                    <div className="spinner" aria-hidden="true" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className={styles.divider} aria-hidden="true">
                  <span>or</span>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleGuestSignIn}
                  disabled={isSigningIn}
                >
                  Continue as Guest
                </button>
              </div>

              <button
                className="btn btn-ghost"
                style={{ marginTop: '1rem' }}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>

              <p className={styles.privacyNote}>
                By continuing, you agree to our{' '}
                <a href="/privacy">Privacy Policy</a>. Your data is
                never sold or used for advertising.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
