# Hackathon Example: QueueLess

QueueLess is a fictional 36-hour hackathon product that lets attendees join a sponsor-booth queue from their phone and return when their turn is close.

I included a hackathon because "documentation first" is often mistaken for a slow process. Under a short deadline, writing down the user, non-goals, and one stable contract matters more, not less. It prevents a team—and its AI tools—from spending the event generating features that do not improve the demo.

## What this example demonstrates

- narrow one user and one complete journey;
- use documents to remove scope rather than add ceremony;
- accept prototype shortcuts explicitly instead of hiding them;
- keep the backend state transition reliable enough for the demo to be trusted;
- choose one deployable application because the deadline does not justify more infrastructure.

## Documents before implementation

1. [`product.md`](product.md) defines attendees as the primary user, a measurable demo outcome, and explicit non-goals.
2. [`architecture.md`](architecture.md) selects one Next.js application and managed services because schedule is the dominant constraint.

## How I would deliver it

1. Validate the queue flow with five attendees using a paper or form prototype.
2. Define join, status, advance, and leave contracts.
3. Build the database transaction and server operations.
4. Add attendee and booth-operator interfaces against those contracts.
5. Deploy early, seed a demo queue, and rehearse the failure path.

No implementation is included. The lesson is the quality and economy of the decisions, not this fictional product.
