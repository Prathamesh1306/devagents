# DevAgents Autonomous Engineering Rules

## Mission

Build the DevAgents platform according to the GitHub Project roadmap
and the authoritative DevAgents architecture/documentation.

The goal is to implement the system incrementally, safely, testably,
and according to the intended enterprise architecture.

---

# 1. Authoritative Documentation

Before implementing any story, inspect the DevAgents documentation located at:

`/Users/prathamesh/My Drive (arceusgaming13@gmail.com)/DevAgents Enterprise Architecture`

This directory contains the project's architecture, PRD, design,
data models, agent flows, security/compliance requirements,
and other implementation documentation.

Treat these documents as the primary architectural reference.

The GitHub Issue defines WHAT needs to be implemented.

The DevAgents Enterprise Architecture documentation defines HOW
the system is intended to be designed and integrated.

The existing repository defines WHAT HAS ALREADY BEEN IMPLEMENTED.

When implementing a story, consider all three.

## Required investigation order

Before writing code:

1. Read the GitHub Issue completely.
2. Read the relevant architecture/PRD documentation.
3. Inspect the existing repository.
4. Identify existing components that can be reused.
5. Identify dependencies and integration points.
6. Only then begin implementation.

Do not invent architecture when the documentation already specifies it.

If the documentation does not specify an implementation detail,
choose a reasonable solution consistent with the existing architecture
and document the decision.

---

# 2. Documentation Discovery

Before implementing a story, search the documentation directory for:

- the Story ID
- the feature name
- relevant service names
- relevant database tables
- agent names
- API endpoints
- security requirements
- architecture decisions
- data models
- agent flows
- infrastructure requirements

Do not assume a document is irrelevant simply because its filename
does not exactly match the story.

Read enough surrounding documentation to understand the intended
architecture.

---

# 3. Source of Truth Hierarchy

When information differs, use this priority:

1. Explicit requirements in the current GitHub Issue
2. DevAgents Enterprise Architecture documentation
3. Existing implemented repository behavior
4. Tests
5. Reasonable engineering judgment

If a conflict cannot be safely resolved:

- Do not silently choose one.
- Document the conflict.
- Do not make destructive architectural changes.
- Ask for human review when necessary.

---

# 4. Story Selection

Every run:

1. Read the GitHub Project.
2. Find stories in Ready/Backlog.
3. Never start a story whose dependencies are incomplete.
4. Select at most 2 stories per run.
5. Prefer the lowest-numbered ready story.
6. Prefer stories that can be safely completed within the current run.
7. Never select a story merely because it is convenient.

Before starting a story, verify its dependency chain.

---

# 5. Implementation

For each story:

1. Read the GitHub issue completely.
2. Read the relevant architecture documentation.
3. Inspect existing repository code.
4. Understand the existing architecture before modifying code.
5. Identify reusable components.
6. Create a feature branch.
7. Implement the story.
8. Follow the documented architecture.
9. Do not implement unrelated features.
10. Preserve existing architecture unless the story requires change.
11. Avoid unnecessary dependencies.
12. Keep changes focused on the story.
13. Update documentation when the story changes documented behavior.

Do not rewrite working components simply because another implementation
looks cleaner.

---

# 6. Database Changes

Before modifying the database:

1. Inspect existing models.
2. Inspect existing migrations.
3. Inspect relevant architecture/data-model documentation.
4. Determine relationships and constraints.
5. Create the appropriate migration.
6. Test upgrade behavior.
7. Test downgrade behavior when applicable.

Never modify production databases directly.

Never delete existing data merely to make a test pass.

---

# 7. API Changes

For API changes:

1. Check existing API conventions.
2. Check the architecture documentation.
3. Reuse existing schemas/models where appropriate.
4. Add validation.
5. Add tests.
6. Verify error responses.
7. Preserve backwards compatibility unless the story explicitly
   requires a breaking change.

---

# 8. Agent / LLM Changes

For agentic components:

1. Read the relevant agent-flow documentation.
2. Understand the state schema.
3. Understand node responsibilities.
4. Understand routing conditions.
5. Preserve checkpoint/state behavior.
6. Avoid putting deterministic logic inside the LLM.
7. Prefer deterministic tools for deterministic operations.
8. Log important agent transitions where required by the architecture.
9. Respect token budgets.
10. Respect guardrails and security requirements.

Never allow an LLM to make a decision that should be enforced
deterministically by application code.

---

# 9. Verification

After implementation:

1. Run unit tests.
2. Run integration tests where available.
3. Run linting.
4. Run type checking.
5. Run security checks.
6. Run relevant migration checks.
7. Run relevant API tests.
8. Run relevant agent/graph tests.
9. Fix failures.
10. Repeat until passing.

Never mark a story Done if tests are failing.

Never remove or weaken a test simply because the implementation
currently fails it.

If a test is genuinely incorrect, document why before changing it.

---

# 10. Acceptance Criteria

Every GitHub story contains acceptance criteria.

Before declaring a story complete:

- Check every acceptance criterion individually.
- Verify each criterion through tests or direct verification.
- Do not assume implementation means completion.
- Do not mark the story Done if any acceptance criterion is unmet.

The final issue comment must explicitly report:

### Acceptance Criteria

- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3

or:

- [ ] Criterion 1 — blocked because ...

---

# 11. Git

Never push directly to `main`.

Create a branch using:

`feature/<story-id>-<short-description>`

Example:

`feature/p1-s1-repo-scaffolding`

Commit using:

`feat(<story-id>): <description>`

Example:

`feat(P1-S1): add project scaffolding`

Push the feature branch.

Create a pull request.

Never:

- force push
- rewrite main history
- delete main
- bypass branch protection
- merge your own PR unless explicitly permitted
- push directly to main

---

# 12. Pull Request

Every completed story should produce a PR containing:

## Summary

What was implemented.

## Architecture

How the implementation fits the documented architecture.

## Changes

Important files/components changed.

## Testing

Commands executed and results.

## Acceptance Criteria

Explicit status of every criterion.

## Documentation

Relevant architecture/PRD documents consulted.

## Known Limitations

Anything intentionally incomplete.

---

# 13. GitHub Project

Update the GitHub Project as work progresses.

When starting:

`Ready → In Progress`

After implementation and successful verification:

`In Progress → In Review`

Do not move an item to Done merely because code was committed.

Done means:

- implementation complete
- tests passing
- acceptance criteria satisfied
- PR created
- no known blocking issue

---

# 14. Failure Handling

If the agent cannot safely complete a story:

1. Do not fake completion.
2. Do not mark it Done.
3. Document the blocker in the GitHub Issue.
4. Leave the work in an appropriate state.
5. Preserve the current work if useful.
6. Do not make speculative architectural changes.
7. Continue to the next safe story only when doing so cannot
   interfere with the blocked work.

If a required architecture decision is ambiguous or contradictory,
stop and request human review.

---

# 15. Security

Never:

- expose secrets
- commit secrets
- print API keys
- modify SSH keys
- use production credentials
- access unrelated personal files
- delete unrelated files
- bypass failing security checks
- disable security controls to make tests pass
- weaken authentication
- bypass authorization
- disable sandbox restrictions
- bypass tenant isolation
- expose private repository data
- upload source code to an external service unless explicitly
  required by the architecture

Use environment variables/secrets management for credentials.

---

# 16. Scope Restrictions

The autonomous agent is authorized to work only inside:

`/Users/prathamesh/devagents`

and read the DevAgents architecture documentation from:

`/Users/prathamesh/My Drive (arceusgaming13@gmail.com)/DevAgents Enterprise Architecture`

Do not modify unrelated directories.

Do not modify personal files.

Do not modify other Git repositories.

Do not modify Google Drive files unless the current story explicitly
requires documentation changes and the target document is clearly
part of the DevAgents project.

---

# 17. Autonomous Run Limit

Each scheduled run may implement a maximum of:

**2 stories**

Do not start a third story even if the first two finish early.

The purpose is controlled autonomous progress rather than maximum
code generation.

---

# 18. Nightly Run Procedure

Every scheduled run follows this sequence:

1. Verify repository state.
2. Pull latest `main`.
3. Read GitHub Project.
4. Identify eligible stories.
5. Verify dependencies.
6. Select up to 2 stories.
7. Read each relevant GitHub Issue.
8. Read relevant architecture documentation.
9. Inspect existing code.
10. Create feature branch.
11. Implement Story 1.
12. Test Story 1.
13. Debug Story 1.
14. Run quality/security checks.
15. Commit Story 1.
16. Push Story 1 branch.
17. Create Story 1 PR.
18. Repeat for Story 2.
19. Update GitHub Project.
20. Add implementation/test summary to issues.
21. Generate nightly report.

If the repository has uncommitted changes before the run:

**Do not overwrite them.**

Determine whether they belong to previous autonomous work.
If ownership cannot be established safely, stop the run.

---

# 19. Nightly Report

At the end of every run, produce a concise report containing:

- Date/time
- Stories selected
- Stories completed
- Stories blocked
- Branches created
- Commits created
- PRs created
- Tests executed
- Test results
- Security checks
- Known issues
- Recommended next stories

Example:

DevAgents Nightly Report

Completed:
- P1-S1
- P1-S2

PRs:
- #12
- #13

Tests:
- 27 passed
- ruff passed
- mypy passed

Blocked:
- None

Next:
- P1-S3
- P1-S4

---

# 20. Definition of Done

A story is DONE only when:

- [ ] Requirements understood
- [ ] Relevant architecture documentation reviewed
- [ ] Existing code inspected
- [ ] Implementation completed
- [ ] Unit tests pass
- [ ] Integration tests pass where applicable
- [ ] Lint passes
- [ ] Type checks pass
- [ ] Security checks pass
- [ ] Acceptance criteria verified
- [ ] Documentation updated where necessary
- [ ] Feature branch pushed
- [ ] Pull request created
- [ ] GitHub Issue updated
- [ ] GitHub Project moved to In Review

Never claim completion without evidence.


## Autonomous Run Logging

After every autonomous run, create or update:

`docs/autonomous-runs/YYYY-MM-DD.md`

The log must record:

1. Run start and completion time.
2. Stories selected.
3. Dependencies verified.
4. Story status.
5. Feature branch created.
6. Files/modules changed.
7. Tests executed and results.
8. Lint/type/security check results.
9. Commit SHA.
10. Pull request number/link.
11. Known limitations.
12. Blockers and failure reasons.
13. Final run summary.

Rules:

- One log file per calendar day.
- Never delete previous run logs.
- Never record secrets, API keys, tokens, credentials, or sensitive environment values.
- Do not claim a test passed unless it was actually executed.
- Do not mark a story complete if verification failed.
- If the run crashes before completion, record the failure and last known state.
- Update the log before finishing the autonomous run.