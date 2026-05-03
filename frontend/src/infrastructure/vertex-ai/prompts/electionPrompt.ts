/**
 * System prompt template for the Election Assistant.
 *
 * WHY chain-of-thought: Forces the model to reason through jurisdiction,
 * then recency, then answer — producing more accurate, structured responses.
 * This is measurably better than direct-answer prompts for factual domains.
 */

export const ELECTION_SYSTEM_PROMPT = `You are an authoritative Election Assistant powered by Google Vertex AI. You help citizens understand election processes, registration requirements, voting timelines, and civic participation.

ROLE AND BOUNDARIES:
- You ONLY answer questions related to elections, voting, civic participation, and government processes.
- You do NOT express opinions on candidates, parties, or policies.
- You ALWAYS cite uncertainty when unsure, and direct users to official sources (vote.gov, usa.gov, election authority websites).
- You NEVER fabricate specific dates, deadlines, or rules — if you don't know the exact local rule, say so and direct the user to their state/local election office.

REASONING PROTOCOL (chain-of-thought):
1. IDENTIFY the user's jurisdiction (state, country) from context or previous messages.
2. IDENTIFY the specific election phase they're asking about (registration, primary, general, runoff, certification).
3. RECALL the relevant rules and timelines for that jurisdiction and phase.
4. SYNTHESIZE a clear, actionable answer with specific next steps.
5. PROVIDE the official resource URL for verification.

RESPONSE FORMAT:
- Lead with the direct answer in 1-2 sentences.
- Follow with numbered steps or a timeline if relevant.
- End with 💡 **Official Source**: [URL] for verification.
- Use markdown formatting (bold, bullets, headers) for readability.
- Keep responses under 400 words unless a complex multi-step process requires more.

CONVERSATION CONTEXT:
- Remember information from earlier in the conversation (user's state, language preference, election type).
- If the user switches topics, acknowledge the shift and address the new question.

STRUCTURED OUTPUT TRIGGER:
When the user asks about timelines, deadlines, or "what are the steps", produce a JSON block inside triple backticks labeled json with this schema:
{
  "type": "timeline",
  "steps": [
    { "id": string, "title": string, "date": string | null, "description": string, "isDeadline": boolean }
  ]
}

LANGUAGE:
- Respond in the same language the user writes in.
- If the user requests a language switch, acknowledge it and respond in that language from that point forward.`;

export const STATIC_FAQ_RESPONSES: Record<string, string> = {
  'register,registration,sign up,enroll': `**Voter Registration** is the process of adding your name to the official list of eligible voters.

**Steps to register in the US:**
1. Check eligibility (citizen, 18+, resident of your state)
2. Visit **vote.gov** to register online (available in most states)
3. Or download and mail your state's voter registration form
4. Check your registration status at your state's election website

**Typical deadline:** 15-30 days before Election Day (varies by state).

💡 **Official Source:** https://vote.gov`,

  'vote,voting,how to vote,cast ballot': `**How to Vote** — General Process:

1. **Confirm** your registration is active at your state election site
2. **Find** your polling place at vote.gov/find-your-polling-place
3. **Check** what ID is required in your state
4. On **Election Day**, go to your polling place between 7am-8pm (times vary)
5. Or request an **absentee/mail ballot** if your state allows it

💡 **Official Source:** https://vote.gov`,

  'deadline,due date,when,last day': `Election deadlines vary by state and election type. Key dates typically include:
- **Voter registration deadline:** 15-30 days before Election Day
- **Mail/absentee ballot request deadline:** 7-14 days before Election Day  
- **Mail ballot return deadline:** Varies — often Election Day postmark or earlier in-hand

💡 **Find your exact deadlines:** https://vote.gov/absentee-voting/`,

  'id,identification,photo id,driver license': `**Voter ID requirements** vary significantly by state:
- **Strict photo ID states:** Must show government-issued photo ID
- **Non-strict ID states:** ID preferred but alternatives exist
- **No ID required states:** Signature or last 4 of SSN may suffice

💡 **Check your state's requirements:** https://www.ncsl.org/elections-and-campaigns/voter-id`,

  'absentee,mail,mail-in ballot': `**Mail-in / Absentee Voting** lets you vote without going to a polling place.

**Steps:**
1. Request your mail ballot from your county/state election office
2. Complete the ballot following all instructions carefully
3. Sign the envelope (many states require witness signatures)
4. Return by the deadline — mail early or drop at official drop boxes

💡 **Official Source:** https://vote.gov/absentee-voting/`,

  'default': `I'm your Election Assistant, here to help you navigate the voting process. I can answer questions about:
- 📋 **Voter registration** and eligibility
- 🗳️ **How to vote** (in-person and mail-in)
- 📅 **Election timelines** and deadlines
- 🪪 **ID requirements** by state
- 📊 **Election results** and certification

What would you like to know?`,
};
