---
name: requirements-reviewer
description: Review a feature against its written specification and acceptance criteria before acceptance or merge. Use when asked to check requirements coverage, implementation evidence, unsupported behavior, data or security risks, or missing tests; this is a read-only review workflow, not an implementation skill.
---

# Requirements reviewer

Use this skill to determine whether an existing feature actually satisfies its specification. Review first; **do not change code, tests, specifications, or any other files unless the user explicitly requests changes**. Never auto-fix a finding.

## Evidence to inspect

1. Read the specified feature document in full: goal, user need, functional rules, constraints, acceptance criteria, verification notes, and out-of-scope items. Read repository `AGENTS.md` as applicable.
2. Trace the relevant implementation, including entry point, UI or API wiring, business logic, storage, and security-sensitive rendering. Follow imports rather than assuming the obvious file is active.
3. Inspect test files, package scripts, and any recorded manual verification. Inspect the changed-file diff when a target branch or pull request is supplied.
4. Run appropriate automated tests if the environment permits, reporting the **actual command, result, and any errors**. If tests cannot be run, say so. Distinguish code inspection, automated tests, and user-reported browser checks.

## Review procedure

1. Build a criterion-by-criterion mapping from each acceptance-criterion ID to specification evidence, relevant implementation, and tests or manual observations.
2. Classify each criterion as **supported**, **gap**, or **not verified**. Do not treat a previous `Pass` in a document as fresh execution evidence; identify its source and date.
3. Look for mismatches and unsupported behavior, especially incorrect priority mappings, unexpected sorting, changed stored data, validation regressions, and behavior beyond scope.
4. Examine data and security concerns: destructive writes or migration, input validation, unsafe DOM/HTML rendering, permission assumptions, and any storage errors. Do not claim a risk exists without explaining the path.
5. Examine missing or outdated tests, invalid imports, gaps in edge-case coverage, and any need for real-browser verification.
6. Before recommending changes, double-check important findings against the actual code and requirements. Separate confirmed problems from hypotheses and avoid creating false positives.

## Required report

Produce these sections:

- **Satisfied acceptance criteria:** list AC IDs, short outcome, and evidence.
- **Gaps / not verified:** list AC IDs and explain the mismatch or missing evidence.
- **Unsupported behavior:** identify behavior absent from, or conflicting with, the specification; say `none identified` when appropriate.
- **Data or security concerns:** explain any concrete concern, or say `none identified in reviewed paths`.
- **Tests still needed:** precise test names or manual scenarios, with whether tests were run.
- **Most important finding and recommended response:** severity, whether it is confirmed, an **accept / modify / reject** recommendation, and the minimal next action.

For each substantive finding, cite the **specific specification section or acceptance-criterion ID and code/test file path with line numbers or quoted identifiers**. Link the finding to evidence on both sides; identify evidence limitations. Never invent test results, browser observations, file contents, or line numbers.

## Read-only boundary

An invocation such as `$requirements-reviewer Review the priority-filter feature against docs/priority-filter-spec.md. Do not change files.` must only report. Do not edit, format, stage, commit, or merge files during the review. If remediation is later authorized, handle that as a separate implementation step and re-run relevant verification.
