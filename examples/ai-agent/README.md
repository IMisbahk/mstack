# AI Application Example: Support Copilot

Support Copilot is a fictional assistant that drafts evidence-linked replies for support agents using approved knowledge. A human reviews and sends every message.

I included this example because AI applications make the philosophy of this repository especially important. Calling a model is easy. Defining when its answer is useful, which evidence it may use, how it should refuse, who owns the final action, and how quality will be measured is the engineering work.

## What this example demonstrates

- begin with the support agent's workflow, not the availability of a model;
- treat prompts, retrieval, model routing, tools, and evaluations as versioned system components;
- make uncertainty visible through citations and refusal behavior;
- preserve human judgment for a consequential external message;
- optimize model cost only after the quality threshold passes.

## Documents before implementation

1. [`product.md`](product.md) defines the assisted user, quality bar, and human-review boundary.
2. [`architecture.md`](architecture.md) defines ingestion, retrieval, generation, citations, provider routing, evaluation, privacy, and safe failure.

## How I would deliver it

1. Collect and label 100 representative, privacy-reviewed support questions.
2. Establish a human-only baseline and acceptance rubric.
3. Implement knowledge ingestion and measure retrieval before generating prose.
4. Define the draft API and structured model output.
5. Build the review interface against that contract.
6. Shadow-test, then release to a small cohort with every send human-approved.
