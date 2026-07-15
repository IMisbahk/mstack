# Product: Support Copilot

> Status: Approved for pilot
> Owner: Support operations
> Last updated: 2026-07-15

**Playbook lesson:** this product is not "a chatbot for support." It starts
with the repeated cost in an agent's workflow and defines evidence, refusal,
and human review before selecting model behavior.

## Vision

Support agents resolve routine questions quickly and consistently while keeping judgment, empathy, and accountability human.

## Problem

Agents search across product docs, policy pages, and prior replies before drafting an answer. This makes first response slow and creates inconsistent policy explanations. Generic AI tools produce fluent text but cannot reliably show which approved source supports a claim.

Twenty ticket reviews show a median of six minutes spent searching and drafting for routine questions. Five agents identified source discovery—not typing—as the largest repeated cost.

## Target users and personas

**Primary user:** a trained support agent handling English-language product and account questions.

**Secondary actors:** support leads who approve knowledge sources and quality reviewers who investigate poor drafts.

**Persona — frontline agent:** handles 40–60 tickets per day, needs a correct draft within the current ticket context, must see evidence, and remains responsible for the sent response.

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| Suggested draft | Agent starts from a relevant response | Draft uses ticket text and approved sources only |
| Inline citations | Agent verifies factual claims quickly | Each policy/product claim links to a source passage |
| Source preview | Agent checks context without switching tools | Citation opens title, version, passage, and URL |
| Feedback | Team learns why drafts fail | Agent can accept, edit, reject, and select a reason |
| Knowledge sync | Suggestions use current guidance | Approved sources are versioned and stale sources can be disabled |

## Non-goals

- Autonomous sending, refunds, account changes, sentiment-based prioritization, non-English replies, customer-facing chat, or learning directly from unreviewed tickets.

## Product rules

- No draft is sent without a human action.
- Unsupported certainty is worse than a clearly stated inability to answer.
- Approved current knowledge outranks similar historic replies.
- The agent must be able to inspect evidence before accepting a draft.

## Success metrics

| Metric | Pilot target |
| --- | --- |
| Median search-and-draft time for eligible tickets | Reduce from 6 minutes to 3 minutes |
| Factual support precision | At least 95% of evaluated factual claims supported by cited passage |
| Agent acceptance with minor or no edit | At least 60% |
| Critical policy errors | 0 in pilot sample |
| Draft p95 latency | Under 8 seconds |

Guardrails: customer satisfaction and reopen rate may not degrade by more than their normal weekly variance; per-draft model cost remains below the agreed budget; secrets and unnecessary personal data never enter prompts.

## Assumptions and validation

- The approved knowledge base contains enough information for at least 70% of routine pilot tickets; validate with a 100-ticket retrieval set.
- Citations help agents detect wrong answers; validate through observed review sessions.
- English-only is acceptable for the first cohort; support operations confirms cohort selection.

## Core journey

1. The agent opens an eligible ticket and requests a suggestion.
2. The system retrieves approved passages and returns a structured draft with citations or declines due to insufficient evidence.
3. The agent inspects sources, edits if needed, and sends through the existing support platform.
4. The system records disposition and edit distance for evaluation, excluding message content from general analytics.

## Risks

- Plausible unsupported claims: constrained output, citation verification, human review, and refusal threshold.
- Stale policy: versioned sources, approval state, and immediate disable control.
- Automation bias: visible "AI draft" label, evidence-first UI, training, and sampled quality review.
- Personal data exposure: minimized prompt construction, provider retention controls, redaction, and access audit.
