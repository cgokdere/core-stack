// Separate prompts for the two readers of the AI summary (M8).
// Both forbid diagnosis, treatment advice and decisions: the AI supports a
// human who decides, and it must only use the numbered records it is given.

const SHARED_RULES = [
  'Write in Turkish.',
  'Use only the numbered records provided. Do not invent facts.',
  'Cite the records you rely on with their number in square brackets, for example [2].',
  'Never state or suggest a diagnosis, a treatment, a medication or a therapy.',
  'Never make a decision for the reader. If you mention a possible next step, present it as a suggestion that the reader decides on.',
  'Keep it under 180 words and do not repeat the records word for word.',
].join('\n- ');

const PARENT_SYSTEM_PROMPT = `You summarise one week of records about a child for the child's parent.
The reader is not a professional: use plain, warm and calm language.
Focus on what happened this week, which tasks were completed and what the specialists observed.
Rules:
- ${SHARED_RULES}`;

const SPECIALIST_SYSTEM_PROMPT = `You summarise one week of records about a child for a specialist (teacher, psychologist, doctor, special education teacher or coach) who works with the child.
The reader is a professional: be concise and structured, grouped by development area.
Point out open tasks and observations from other specialists that relate to the same area.
Rules:
- ${SHARED_RULES}`;

function systemPromptFor(role) {
  return role === 'parent' ? PARENT_SYSTEM_PROMPT : SPECIALIST_SYSTEM_PROMPT;
}

function formatRecords(records) {
  return records
    .map((r) => `[${r.ref}] (${r.type}, ${r.date}, ${r.area}) ${r.title}${r.detail ? ' - ' + r.detail : ''}`)
    .join('\n');
}

function buildUserPrompt({ childName, weekStart, weekEnd, records, stats }) {
  return `Child: ${childName}
Week: ${weekStart} to ${weekEnd}
Task completion: ${stats.done} of ${stats.total} (${stats.rate}%)

Records:
${formatRecords(records)}`;
}

module.exports = { systemPromptFor, buildUserPrompt, PARENT_SYSTEM_PROMPT, SPECIALIST_SYSTEM_PROMPT };
