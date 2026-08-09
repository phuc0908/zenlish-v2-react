// Bold the correct-answer line(s) and the question number inside each
// explanation_transcript, using <b>...</b>.
//
// Robust across all parts:
//  - correct answer identified by LETTER (sub.correct_answer), language-agnostic
//  - choice format auto-detected: "(A) ..." (parenthetical) or "A. ..." (letter-dot, Part 5)
//  - question number taken from the leading number of the `question` field
//
// Usage: node bold_transcript.js <file.json> [--write]

const fs = require('fs');

const file = process.argv[2];
const write = process.argv.includes('--write');
if (!file) { console.error('Usage: node bold_transcript.js <file.json> [--write]'); process.exit(1); }

const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

let changed = 0, skipped = 0, samples = [];

function boldLetter(t, letter) {
  // parenthetical mode if the transcript uses "(A)"-style choice markers
  const paren = /\([A-D]\)/.test(t);
  let re;
  if (paren) {
    re = new RegExp('(^|\\n)(\\(' + letter + '\\)[^\\n]*)', 'g');
  } else {
    // letter-dot mode, e.g. "B. her (...): ..."
    re = new RegExp('(^|\\n)(' + letter + '\\.[^\\n]*)', 'g');
  }
  return t.replace(re, (m, pre, line) => {
    if (line.startsWith('<b>')) return m;      // already bolded
    return pre + '<b>' + line + '</b>';
  });
}

function boldNumber(t, n) {
  if (n == null) return t;
  // bold the standalone question-number heading, e.g. "34." at line start
  const re = new RegExp('(^|\\n)(' + n + '\\.)', 'g');
  return t.replace(re, (m, pre, num) => pre + '<b>' + num + '</b>');
}

for (const term of data) {
  for (const q of (term.questions || [])) {
    for (const sub of (q.sub_questions || [])) {
      let t = sub.explanation_transcript;
      if (!t || typeof t !== 'string') continue;
      const letter = (sub.correct_answer || '').trim();
      const nm = /^\s*(\d+)/.exec(sub.question || '');
      const n = nm ? nm[1] : null;
      const before = t;
      if (/[A-D]/.test(letter)) t = boldLetter(t, letter);
      t = boldNumber(t, n);
      if (t !== before) {
        changed++;
        if (samples.length < 6) samples.push({ part: term.term_name, q: sub.question, letter, before, after: t });
      } else {
        skipped++;
      }
      sub.explanation_transcript = t;
    }
  }
}

console.log(`changed=${changed} skipped=${skipped}`);
for (const s of samples) {
  console.log('\n===== ' + s.part + ' | letter=' + s.letter + ' | ' + JSON.stringify(s.q).slice(0, 60) + ' =====');
  console.log('--- AFTER ---');
  console.log(s.after);
}

if (write) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log('\n[written] ' + file);
} else {
  console.log('\n[dry-run] no file written (add --write)');
}
