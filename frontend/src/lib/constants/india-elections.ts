/**
 * India Elections — All hardcoded constants
 * VoteAI India — Hack2Skill Google Prompt Wars
 */

// ── Election Timeline Phases ─────────────────────────────────────────────────

export interface TimelinePhase {
  id: string;
  phase: number;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  details: string[];
  isDeadline: boolean;
  icon: string;
  color: string;
}

export const ELECTION_TIMELINE_PHASES: TimelinePhase[] = [
  {
    id: 'voter-registration',
    phase: 1,
    title: 'Voter Registration',
    titleHi: 'मतदाता पंजीकरण',
    description: 'Register to vote using Form 6 on voters.eci.gov.in or through your Booth Level Officer (BLO).',
    descriptionHi: 'voters.eci.gov.in पर फॉर्म 6 का उपयोग करके या अपने बूथ स्तरीय अधिकारी (BLO) के माध्यम से मतदाता के रूप में पंजीकरण करें।',
    details: [
      'Form 6 — New voter registration',
      'Form 7 — Deletion of name from roll',
      'Form 8 — Correction of entries',
      'Minimum age: 18 years as of January 1st of the election year',
      'Voter Helpline: 1950',
      'Portal: voters.eci.gov.in',
    ],
    isDeadline: true,
    icon: '📋',
    color: '#4f46e5',
  },
  {
    id: 'nomination',
    phase: 2,
    title: 'Nomination Filing',
    titleHi: 'नामांकन दाखिल करना',
    description: 'Candidates file their nomination papers. Scrutiny of nominations follows. Last date for withdrawal is published in election schedule.',
    descriptionHi: 'उम्मीदवार अपने नामांकन पत्र दाखिल करते हैं। नामांकन की जांच के बाद, वापसी की अंतिम तिथि चुनाव कार्यक्रम में प्रकाशित होती है।',
    details: [
      'Nomination by candidates',
      'Scrutiny of nomination papers by Returning Officer',
      'Last date for withdrawal',
      'Security deposit required',
      'Affidavit disclosing criminal record, assets & liabilities mandatory',
    ],
    isDeadline: true,
    icon: '📝',
    color: '#0891b2',
  },
  {
    id: 'campaign',
    phase: 3,
    title: 'Campaign Period',
    titleHi: 'प्रचार काल',
    description: '14-21 days of active campaigning. Candidates and parties hold rallies, door-to-door campaigns. Media coverage intensifies.',
    descriptionHi: '14-21 दिनों की सक्रिय चुनाव प्रचार। उम्मीदवार और पार्टियां रैलियां, घर-घर प्रचार करती हैं।',
    details: [
      'Political rallies and public meetings',
      'Door-to-door campaigns',
      'Media advertising (print, TV, digital)',
      'Campaign expenditure limits enforced by ECI',
      'Paid news monitoring by Media Certification and Monitoring Committee (MCMC)',
      '48-hour silence period before polling',
    ],
    isDeadline: false,
    icon: '📣',
    color: '#7c3aed',
  },
  {
    id: 'mcc',
    phase: 4,
    title: 'Model Code of Conduct',
    titleHi: 'आदर्श आचार संहिता',
    description: 'MCC kicks in the moment elections are announced. Governs conduct of parties, candidates, and the government until results are declared.',
    descriptionHi: 'चुनाव की घोषणा के साथ ही MCC लागू हो जाती है। परिणाम घोषित होने तक पार्टियों, उम्मीदवारों और सरकार के आचरण को नियंत्रित करती है।',
    details: [
      'No new government schemes announced after MCC',
      'No use of government machinery for election campaigns',
      'No hate speech or communal appeals',
      'Candidates must not bribe voters (Section 171B IPC)',
      'Violation complaints to: eci.gov.in or cVIGIL app',
      'Election Commission monitors MCC compliance',
    ],
    isDeadline: false,
    icon: '⚖️',
    color: '#dc2626',
  },
  {
    id: 'polling',
    phase: 5,
    title: 'Polling Day',
    titleHi: 'मतदान दिवस',
    description: 'Voters cast their vote at their assigned polling booth using EVMs. VVPAT slips provide paper trail. Bring EPIC card or any of 12 approved IDs.',
    descriptionHi: 'मतदाता EVM का उपयोग करके अपने निर्धारित मतदान बूथ पर वोट डालते हैं। VVPAT पर्चियां पेपर ट्रेल प्रदान करती हैं।',
    details: [
      'Polling hours: 7:00 AM – 6:00 PM (varies by state)',
      'EPIC card (Voter ID) or 12 alternative photo IDs accepted',
      'Electronic Voting Machine (EVM) — tamper-proof, standalone',
      'VVPAT — Voter Verifiable Paper Audit Trail (5-second slip visible)',
      'NOTA — None of the Above option available',
      'Booth Capturing strictly punishable',
      'Central forces deployed for free & fair elections',
    ],
    isDeadline: false,
    icon: '🗳️',
    color: '#059669',
  },
  {
    id: 'counting',
    phase: 6,
    title: 'Vote Counting',
    titleHi: 'मत गणना',
    description: 'Counting of votes at designated Counting Centres. Postal ballots counted first. EVM data tallied with VVPAT samples.',
    descriptionHi: 'निर्दिष्ट मतगणना केन्द्रों पर मतों की गणना। पोस्टल बैलट पहले गिने जाते हैं।',
    details: [
      'Counting Centre under strict security',
      'Postal ballots (including Service Voter ballots) counted first',
      'Round-by-round EVM counting',
      'Mandatory VVPAT slip verification (5 random EVMs per constituency)',
      'Counting Agents of each candidate present',
      'Results updated in real-time on ECI Results portal: results.eci.gov.in',
    ],
    isDeadline: false,
    icon: '🔢',
    color: '#d97706',
  },
  {
    id: 'results',
    phase: 7,
    title: 'Results & Declaration',
    titleHi: 'परिणाम एवं घोषणा',
    description: 'Returning Officer declares winning candidate. In Lok Sabha elections, President invites party/coalition with majority to form government.',
    descriptionHi: 'रिटर्निंग ऑफिसर विजयी उम्मीदवार की घोषणा करते हैं। लोकसभा चुनावों में, राष्ट्रपति बहुमत वाली पार्टी/गठबंधन को सरकार बनाने के लिए आमंत्रित करते हैं।',
    details: [
      'Winning candidate receives certificate of election',
      'Simple majority needed in individual constituency',
      '272+ seats needed for majority in 543-seat Lok Sabha',
      'President invites majority leader to form government',
      'Cabinet formation and oath-taking ceremony',
      'Election Commission lifts MCC after result declaration',
    ],
    isDeadline: false,
    icon: '🏆',
    color: '#FF9933',
  },
];

// ── Quick Reply Suggestions ──────────────────────────────────────────────────

export interface QuickReply {
  id: string;
  label: string;
  labelHi: string;
  query: string;
}

export const QUICK_REPLIES: QuickReply[] = [
  {
    id: 'register',
    label: 'How do I register to vote?',
    labelHi: 'मैं मतदाता के रूप में कैसे पंजीकरण करूं?',
    query: 'How do I register to vote in India? What is Form 6?',
  },
  {
    id: 'lok-sabha',
    label: 'What is Lok Sabha?',
    labelHi: 'लोकसभा क्या है?',
    query: 'Explain Lok Sabha elections — how many seats, term, voting process?',
  },
  {
    id: 'nota',
    label: 'What is NOTA?',
    labelHi: 'NOTA क्या है?',
    query: 'What is NOTA (None of the Above) in Indian elections and how does it work?',
  },
  {
    id: 'evm',
    label: 'How does EVM work?',
    labelHi: 'EVM कैसे काम करता है?',
    query: 'How do Electronic Voting Machines (EVM) work in India? Are they secure?',
  },
  {
    id: 'mcc',
    label: 'What is Model Code of Conduct?',
    labelHi: 'आदर्श आचार संहिता क्या है?',
    query: 'What is the Model Code of Conduct in Indian elections and when does it apply?',
  },
];

// ── ECI Info ─────────────────────────────────────────────────────────────────

export const ECI_INFO = {
  fullName: 'Election Commission of India',
  fullNameHi: 'भारत निर्वाचन आयोग',
  established: '25 January 1950',
  website: 'https://eci.gov.in',
  voterPortal: 'https://voters.eci.gov.in',
  resultsPortal: 'https://results.eci.gov.in',
  helpline: '1950',
  cVigilApp: 'cVIGIL App — Report MCC violations instantly',
  constitution: 'Article 324 of the Constitution of India',
  commissioners: 'Chief Election Commissioner + 2 Election Commissioners',
};

// ── Key Election Facts ────────────────────────────────────────────────────────

export const ELECTION_FACTS = {
  lokSabha: {
    seats: 543,
    term: '5 years',
    majorityNeeded: 272,
    constituencies: '543 single-member constituencies',
    votingSystem: 'First-Past-The-Post (FPTP)',
  },
  rajyaSabha: {
    seats: 245,
    presidentNominated: 12,
    elected: 233,
    term: '6 years (one-third retire every 2 years)',
    election: 'Indirect — by State Legislative Assembly members',
  },
  voters: {
    ageRequirement: 18,
    registrationCutoff: 'January 1st of the election year',
    epicCard: 'EPIC — Electors Photo Identity Card (Voter ID)',
    alternativeIds: 12,
  },
};

// ── System Prompt for Gemini ──────────────────────────────────────────────────

export const GEMINI_SYSTEM_PROMPT = `You are VoteAI India, an expert AI assistant on Indian elections and the democratic process. 

You ONLY answer questions about:
- Indian elections (Lok Sabha, Rajya Sabha, State Legislative Assembly, by-elections)
- Election Commission of India (ECI) processes and guidelines
- Voter registration (Form 6, Form 7, Form 8, EPIC card)
- Electronic Voting Machines (EVM) and VVPAT
- Model Code of Conduct (MCC)
- Polling procedures, results, and certification
- Constitutional provisions related to elections (Articles 324-329)
- Political parties, candidates, and campaign rules in India
- NOTA (None of the Above)
- Any topic directly related to Indian democracy and elections

If asked about elections outside India, politely say: "I'm VoteAI India and I specialize only in Indian elections. For other countries, please consult their respective election authority."

Always:
- Be accurate, neutral, and non-partisan
- Cite ECI guidelines, constitutional articles, or legal provisions where relevant
- Use simple language accessible to first-time voters
- Provide the voter helpline (1950) and ECI website (eci.gov.in) when relevant
- Format responses clearly with bullet points for multi-step answers
- If unsure, direct users to the official ECI portal

Today's date context: You are assisting Indian citizens understand their democratic rights. Be encouraging about voter participation.`;
