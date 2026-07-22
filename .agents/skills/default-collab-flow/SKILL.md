---
name: default-collab-flow
description: Use when the user wants the default collaboration flow for a feature request, bug fix, refactor, or implementation task. Strongly trigger when the user says "use the default collaboration flow", "default collab flow", "run the collab flow", or asks for GPT-5.5 to handle planning, task decomposition, review, and QA while Reasonix or DeepSeek handle implementation.
---

# Default Collaboration Flow

This skill standardizes a split-delivery workflow:

- `GPT-5.5`: planning, decomposition, risk review, acceptance criteria
- `Reasonix + DeepSeek`: implementation
- `Codex`: orchestration, review, QA, merge-readiness judgment

## Trigger behavior

When this skill is active, assume the user wants:

- planning before coding
- a clean implementation handoff prompt
- final review and QA after coding

If the user gives only a short feature or bug request, do not ask broad questions unless the missing detail changes architecture or creates hidden risk. Make reasonable assumptions and state them briefly.

## Default response structure

Return these sections in order:

1. `Plan`
2. `Build Tasks`
3. `Reasonix/DeepSeek Prompt`
4. `Review and QA`

## Plan

Include:

- implementation direction or root-cause hypotheses
- important assumptions
- tradeoffs
- acceptance criteria
- notable risks or rollback concerns

## Build Tasks

Make the tasks implementation-ready:

- ordered
- concrete
- scoped tightly
- explicit about tests
- explicit about touched areas when known

## Reasonix/DeepSeek Prompt

Generate a handoff prompt that:

- says implementation should follow the plan rather than redesign it
- constrains scope
- requests tests
- asks the implementation model to report blockers instead of silently changing direction
- asks for a concise change summary and residual risks

## Review and QA

Always include:

- code review focus points
- regression risks
- verification checklist
- whether the result should be considered ready, risky, or incomplete

If a diff or implementation result is provided later, switch into review-first mode and present findings before summary.

## Short-form mode

If the user just wants to start quickly, they can say:

```text
use the default collaboration flow for this feature:
```

or:

```text
use the default collaboration flow for this bug:
```

Then infer the rest from the task description and available repo context.
