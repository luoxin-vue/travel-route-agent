---
name: kaifa
description: Use when the user wants the default development collaboration flow for a feature request, bug fix, refactor, or implementation task. Strongly trigger when the user invokes kaifa, says $kaifa, mentions /kaifa, or asks for GPT-5.5 to do planning, task decomposition, review, and QA while Reasonix or DeepSeek handle implementation.
---

# Kaifa

This skill standardizes a split-delivery workflow:

- `GPT-5.5`: planning, decomposition, risk review, acceptance criteria
- `Reasonix + DeepSeek`: implementation
- `Codex`: orchestration, review, QA, merge-readiness judgment

## Language and tone

Default to Chinese when the user writes in Chinese.

Keep the output practical and execution-oriented:

- short headings
- concrete task breakdown
- direct handoff wording for implementation models
- concise review conclusions

Unless the user asks otherwise, prefer Chinese for:

- plan summaries
- task lists
- review findings
- QA checklists

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

When responding in Chinese, prefer these labels:

1. `Implementation Plan`
2. `Task Breakdown`
3. `Reasonix/DeepSeek Handoff`
4. `Review / QA`

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

When possible, include:

- likely files or modules
- edge cases
- rollback notes
- required validation steps

## Reasonix/DeepSeek Prompt

Generate a handoff prompt that:

- says implementation should follow the plan rather than redesign it
- constrains scope
- requests tests
- asks the implementation model to report blockers instead of silently changing direction
- asks for a concise change summary and residual risks

Default handoff style:

- "you are responsible for implementation, not re-planning"
- "follow the task list closely"
- "do not expand scope without cause"
- "if blocked, report blockers and suggestions"
- "add necessary tests"

If the user writes in Chinese, generate the handoff prompt in Chinese by default.

## Review and QA

Always include:

- code review focus points
- regression risks
- verification checklist
- whether the result should be considered ready, risky, or incomplete

If a diff or implementation result is provided later, switch into review-first mode and present findings before summary.

For review turns, prioritize:

- behavioral regressions
- logic bugs
- missing test coverage
- mismatch from original plan
- hidden scope creep

If there are no findings, say so explicitly and mention any remaining verification gaps.

## Short-form mode

The user can start with either of these:

```text
/kaifa add a forgot-password flow
```

```text
Use $kaifa for this bug: checkout button stays disabled after valid input.
```

For Chinese-first usage, these should also trigger the workflow strongly:

```text
/kaifa handle this feature: add SMS login on the sign-in page
```

```text
$kaifa handle this bug: the button stays disabled after the form becomes valid
```
