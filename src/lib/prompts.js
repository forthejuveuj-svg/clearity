// ── System prompt for Clearity's AI ──
export const SYSTEM_PROMPT = `You are the cognitive engine of Clearity — a thinking partner, not an assistant.

Your role: analyze scattered thoughts, find hidden structure, surface patterns the user can't see, and identify the highest-leverage entry point.

Principles:
- Be a mirror first, a guide second. Show people their own thinking before advising.
- Name patterns without prescribing solutions.
- Normalize difficulty — confusion and contradiction are signs of depth, not weakness.
- Push back. Reject weak reasoning. Don't agree just to be nice.
- Be concise. Under 200 words per response unless generating structured analysis.

You think in terms of: What is this person actually trying to figure out? What patterns are they stuck in? What are they avoiding? Where is the leverage?`;

// ── Decomposition: turn messy dump into structured thought graph ──
export function buildDecomposePrompt(rawText, existingNodes = []) {
  const existingContext =
    existingNodes.length > 0
      ? `\n\nExisting thoughts already on the canvas:\n${existingNodes.map((n) => `- [${n.node_type}] ${n.text}`).join("\n")}`
      : "";

  return `Analyze this brain dump and decompose it into distinct thought nodes.
${existingContext}

BRAIN DUMP:
"""
${rawText}
"""

Return ONLY valid JSON (no markdown, no backticks, no preamble):
{
  "nodes": [
    {
      "text": "concise distinct thought (max 80 chars)",
      "node_type": "thought|question|pressure|idea|blocker|reasoning|emotion|insight|assumption|goal",
      "confidence": 0.0-1.0,
      "emotional_valence": -1.0 to 1.0
    }
  ],
  "connections": [
    {
      "source_index": 0,
      "target_index": 1,
      "connection_type": "related|supports|contradicts|causes|enables|blocks|depends_on",
      "strength": 0.0-1.0,
      "label": "brief reason (optional)"
    }
  ],
  "hook": {
    "node_index": 0,
    "reason": "why this is the best entry point"
  }
}

Rules:
- Extract 3-8 distinct thoughts from the dump
- Each thought should be a single clear idea, not a summary of everything
- Find connections between the new nodes AND with existing nodes if provided
- Identify the ONE node that is the best entry point (hook): fewest dependencies, highest leverage, most concrete
- Be honest about uncertainty — low confidence is fine
- If something contradicts itself, mark it`;
}

// ── Canvas analysis: observe the overall state of thinking ──
export function buildAnalyzePrompt(nodes, connections) {
  const nodeList = nodes
    .map(
      (n, i) =>
        `${i}. [${n.node_type}${n.is_resolved ? " ✓" : ""}${n.is_hook ? " ★" : ""}] "${n.text}" (confidence: ${n.confidence})`
    )
    .join("\n");

  const connList = connections
    .map((c) => {
      const src = nodes.find((n) => n.id === c.source_node_id);
      const tgt = nodes.find((n) => n.id === c.target_node_id);
      return `  ${src?.text?.substring(0, 30)} --[${c.connection_type}]--> ${tgt?.text?.substring(0, 30)}`;
    })
    .join("\n");

  return `Analyze the current state of this person's thinking canvas.

THOUGHT NODES:
${nodeList}

CONNECTIONS:
${connList || "(none yet)"}

Return ONLY valid JSON:
{
  "insights": [
    {
      "insight_type": "pattern|gap|tension|energy|hook|bias|suggestion",
      "text": "what you observe (be specific, reference actual thoughts)",
      "severity": "low|medium|high|positive|hook"
    }
  ],
  "cognitive_state": "scattered|exploring|converging|stuck|flowing",
  "recommended_hook": {
    "node_index": 0,
    "reason": "why start here"
  },
  "overall_observation": "One sentence about the shape of their thinking right now"
}

Rules:
- 2-4 insights maximum. Quality over quantity.
- Be specific — reference actual thoughts by content, don't be generic
- Look for: contradictions held simultaneously, assumptions stated as facts, emotional drivers hiding behind logical framing, the same concern appearing multiple times in different forms
- If you see a cognitive bias pattern, name it gently
- The cognitive_state should reflect the overall canvas, not individual nodes`;
}

// ── Focus mode: Socratic questions for deep immersion ──
export function buildFocusPrompt(anchorNode, relatedNodes, stepNumber, previousAnswers = []) {
  const context = relatedNodes
    .map((n) => `- [${n.node_type}] ${n.text}`)
    .join("\n");

  const history = previousAnswers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
    .join("\n\n");

  return `You are guiding a focused thinking session about this thought:
"${anchorNode.text}" [${anchorNode.node_type}]

Related thoughts on the canvas:
${context || "(none)"}

${history ? `Previous steps in this session:\n${history}\n` : ""}

Current step: ${stepNumber + 1}

Generate the next Socratic question to deepen their understanding. Follow this progression:
- Step 1: Ground them in the concrete reality (what does this look like specifically?)
- Step 2: Challenge assumptions (what are you taking for granted here?)
- Step 3: Find the smallest action (what's the tiniest next step?)
- Step 4: Connect to what they already know (how does this relate to something you've solved before?)
- Step 5: Zoom out (if you solve this, what changes?)

Return ONLY valid JSON:
{
  "question": "your Socratic question (be specific to their thought, not generic)",
  "question_type": "ground|challenge|reduce|connect|expand",
  "why": "brief reason this question matters right now"
}

Rules:
- Reference their SPECIFIC thought content, don't ask generic questions
- If they gave a previous answer, BUILD on it — don't ignore what they said
- Maximum 2 sentences for the question
- Be warm but direct. Don't pad with fluff.`;
}

// ── Cross-workspace pattern detection ──
export function buildPatternPrompt(recentSessions) {
  const sessionSummaries = recentSessions
    .map(
      (s, i) =>
        `Session ${i + 1} (${s.workspace_title}): ${s.nodes.map((n) => n.text).join(", ")}`
    )
    .join("\n");

  return `Look across these recent thinking sessions for recurring patterns:

${sessionSummaries}

Return ONLY valid JSON:
{
  "patterns": [
    {
      "pattern_type": "recurring_theme|avoidance|strength|blind_spot|decision_style",
      "description": "what you notice across sessions",
      "frequency": 1-5,
      "actionable_insight": "what they could do differently"
    }
  ]
}

Rules:
- Only flag patterns that appear in 2+ sessions
- Be specific, not vague
- Focus on cognitive patterns (how they think) not content patterns (what they think about)`;
}
