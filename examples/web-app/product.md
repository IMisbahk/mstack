# Product: LocalBoard

> Status: Approved for neighborhood pilot
> Owner: Community product lead
> Last updated: 2026-07-15

**Playbook lesson:** the product deliberately avoids social-network features.
A finite, expiring, moderated feed serves the documented local-information
need better than optimizing for time spent.

## Vision

People can quickly understand and help with what is happening near them without joining a noisy global social network.

## Problem

Local updates are fragmented across chat groups, paper notices, and broad social feeds. Important items disappear in conversation, newcomers lack access, and exact home addresses are often shared more widely than intended. Community organizers cannot consistently classify, expire, or moderate information.

Interviews with twelve residents identified road disruptions, lost-and-found notices, and event information as the highest-value repeated updates.

## Target users and personas

**Primary user:** an adult resident of the pilot neighborhood who wants timely, relevant updates and can verify residence.

**Secondary user:** a trusted volunteer moderator who reviews reports and protects community rules.

**Resident persona:** checks updates a few times per week, posts rarely, uses a phone, wants relevance without public exposure of their precise location, and needs clear reporting controls.

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| Neighborhood feed | Resident sees recent relevant updates | Active posts sorted by urgency then recency with category filter |
| Structured post | Information remains scannable | Author selects category, approximate area, expiry, title, body, and optional image |
| Report and moderation | Harmful or incorrect posts can be handled | Resident reports with reason; moderator hides, restores, or removes with audit note |
| Expiration | Stale information disappears | Post expires automatically and author may close it early |
| Saved post | Resident can return to an important notice | Private saved state appears in a personal list |

## Non-goals

- Direct messaging, comments, follower counts, reactions, advertising, exact live location, multiple neighborhoods, real-time chat, or native mobile applications.

## Product principles

- Utility outranks engagement; no infinite engagement mechanics.
- Show approximate areas, never household-level coordinates.
- Content has an expected lifetime.
- Moderation actions are explainable and reversible where safe.

## Success metrics

| Metric | Eight-week pilot target |
| --- | --- |
| Weekly residents who view at least one useful post | 40% of verified pilot members |
| Posts rated useful through a lightweight prompt | At least 70% |
| Median time to handle high-priority report | Under 4 hours during published coverage |
| Posts expired or closed on time | At least 95% |
| Moderator workload | Under 30 minutes per day median |

Guardrails: no confirmed precise-address exposure caused by product defaults; report rate and moderator reversals are reviewed weekly; accessibility target is WCAG 2.2 AA.

## Core journey

1. A resident verifies their email and neighborhood invitation.
2. They open a finite feed of active posts.
3. They create a lost-pet post with an approximate area, photo, and 72-hour expiry.
4. Other residents see and save it; one reports an accidental phone number in the body.
5. A moderator hides the post, requests a safe edit, and restores it with an audit note.
6. The author marks the pet found, closing the post.

## Assumptions and risks

- One community organization can distribute invitations and provide two moderators.
- Structured categories and expiry make the feed more useful than a chat group; validate in the pilot.
- Abuse may exceed volunteer capacity; registration limits, rate controls, and a pause-new-posts switch are required.
- Image metadata or text may reveal location; strip metadata and warn users before publication.
