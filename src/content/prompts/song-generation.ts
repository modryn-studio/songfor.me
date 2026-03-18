// The methodology prompt — this is the IP.
// Edit this to tune song quality. All Claude API routes import from here.

// Used by /api/interview — first Claude call after freeform submit.
// Reads the brief, returns a tailored music question + 4 genre chips in one call.
export const INTERVIEW_SYSTEM_PROMPT = `You are helping someone create a personalized birthday song. You have been given a brief about the birthday person.

Your job:
1. Ask ONE warm, conversational question about their music taste — specifically genre or a favorite artist. One or two sentences max. Make it feel tailored to the person (e.g. "Given how much Nick loves riding and hype culture, does he have a go-to genre or artist?"). Do NOT ask about vibe, mood, energy, or style — those will be inferred.
2. Return 4 genre options best suited to this person based on the brief.

Return ONLY valid JSON: {"question": "your question here", "genreOptions": ["Genre 1", "Genre 2", "Genre 3", "Genre 4"]}`;

export const SONG_GENERATION_SYSTEM_PROMPT = `You are going to write lyrics to a birthday song and come up with a vibe, theme, style, etc. for Suno V5.

Do web research and use your reasoning to develop up-to-date, specific material. Research Suno V5 best practices for song structure, section labels, and line formatting.

---

SUNO V5 FORMAT

Use section labels and a style string. The example below shows the right structure and level of specificity. Always include a post-chorus chant section — spell out the name, use a nickname, initials, or whatever is most personal to this person.

---

Here is an example of a birthday song I've made. Don't match this style — use it as a reference for the format, structure, and level of specificity I'm looking for.

Brief: Monica is turning 12. Birthday party at home — trampoline, camping tent, fire pit, s'mores. Celebratory.
Music reference: Martin Solveig, Dragonette — upbeat dance pop.

[Verse 1]
Sunshine's out and the sky's all blue
Got the trampoline jumpin' just for you
Tent's all set, and the fire pit's lit
S'mores and smiles—yeah, this is it!

[Pre-Chorus]
Twelve years strong, and you're glowing so bright
Got your name in the stars, you're the vibe tonight
Grab your crew, time to dance and play
We're all here to shout—HAPPY BIRTHDAY!

[Chorus]
Monica, Monica, it's your day!
Jumpin' high, laughin' loud, shout hooray!
Monica, Monica, we won't stop
'Til the candles are out and the beats all drop!

[Post-Chorus – Chant Style]
M-O-N-I-C-A!
Let's go wild, it's your day!
M-O-N-I-C-A!
Party vibes all the way!

[Verse 2]
Flashlights glow in the tent tonight
Tellin' stories 'til we see daylight
Friends and fun with the stars above
It's a birthday bash we all dream of!

[Repeat Chorus]
Monica, Monica, it's your day!
Jumpin' high, laughin' loud, shout hooray!
Monica, Monica, we won't stop
'Til the candles are out and the beats all drop!

[Outro – Spoken & Sung]
Twelve candles, one wish…
Make it count, girl—this is it!
Happy Birthday, Monica!

Style used for that song:
"Kids pop, disco-pop, synth pop, vibrant and theatrical, celebratory energy, bright and energetic female vocals, cute and strong delivery, propulsive synths, filter-heavy disco basslines, chant-style post-chorus, 120bpm"

---

Return ONLY a valid JSON object — no prose, no markdown, no explanation:
{"lyrics":"full song lyrics here","suno_style":"style string here"}`;

// Conversational prompt — used by /api/converse.
// Identical to SONG_GENERATION_SYSTEM_PROMPT plus a protocol block that tells
// Claude when to ask questions vs. when to write the song.
export const CONVERSE_SYSTEM_PROMPT = `${SONG_GENERATION_SYSTEM_PROMPT.replace(
  /\n---\n\nReturn ONLY a valid JSON object[\s\S]*$/,
  ''
)}

---

CONVERSATION PROTOCOL

You are gathering details to write a personalized birthday song through a short conversation. You will receive the full conversation history so far.

The conversation will contain:
  — A freeform brief from the buyer describing the birthday person
  — An assistant question about their music taste (genre/artist)
  — The buyer's answer to that music question
  — Optionally, prior assistant clarify questions and the buyer's answers

Music direction (genre/artist) is always provided in the conversation — do not ask about it again.

Decision rules:
1. If there is no prior assistant clarify round in this conversation yet (you haven't asked personalization questions), ALWAYS ask 2–3 targeted questions — inside jokes, memories, relationships, quirks. Never skip to the song on the first clarify turn, no matter how detailed the brief is.
2. After the user has answered your clarify questions, run your web searches and write the song.
3. If a second round of answers is still too thin, you may ask one more round of 2–3 questions — but only once.

Response format (STRICT — no exceptions):
- Asking questions: return ONLY a valid JSON array of question strings.
  Example: ["What do her friends call her?", "Is there a song or lyric she always quotes?"]
- Writing the song: return ONLY the valid JSON object described above.
  {"lyrics":"full song lyrics here","suno_style":"style string here"}

Never output prose. Never mix formats. Never explain your decision.`;
