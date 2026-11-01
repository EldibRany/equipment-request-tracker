# Exercise 7 — requirements-reviewer assessment

Reviewed: 2026-11-01
Feature: priority filter
Specification: `docs/priority-filter-spec.md`
Review approach: followed the read-only review workflow documented in `.agents/skills/requirements-reviewer/SKILL.md` before separately authorizing the test repair.

> Execution note: a Codex Skill invocation was not available in this environment; this is an evidence-based application of the Skill's procedure. Existing browser Pass records were user-reported on October 18, 2026, not freshly observed during this review.

## Satisfied acceptance criteria

| Criteria | Assessment and evidence |
| --- | --- |
| AC1 | Implementation supported: `index.html:107-113` labels and orders All, High, Normal, Low; `src/app.js:21-25` initializes All and renders the saved requests. |
| AC2–AC5 | Implementation supported: `src/request-store.js:56-59` uses exact priority matching, preserves order and includes every request for All; `tests/request-store.test.js:89-115` exercises interleaved priorities, missing and unrecognized values, and restoration. |
| AC6 | Implementation supported: `src/app.js:57-63` toggles no-match output; `index.html:115` contains the required exact message. |
| AC7 | Implementation supported: filtering does not save data (`src/app.js:57-63`); `tests/request-store.test.js:89-115` checks repeated switching, stable order and unchanged storage. |
| AC8 | Implementation supported: `src/app.js:60-63` distinguishes empty All from empty specific-priority results. |
| AC9 | Implementation supported: the native select has a visible label (`index.html:107-113`) and a focus outline (`styles.css:149-154`). Historical keyboard-browser check is user-reported. |
| AC10 | Implementation supported: `src/app.js:21` resets filter to All on page start, using requests from `loadRequests`. |
| AC11 | Implementation supported: `src/app.js:27-52` retains form validation and creation; `src/app.js:36-40` rerenders with the current selected priority after save; `tests/app.test.js` covers validation/save/filter interactions. |
| AC12 | Implementation supported: `package.json` retains dependency-free local scripts; `index.html:160` loads `src/app.js`. |
| AC13 | Current local validation (reconstructed repository test files and relevant application HTML): `npm test` gave **22 passed / 0 failed** on Node 22. This was not run from a Git clone, because network access prevented cloning the remote repository. Original specification separately records a prior 22/22 `node --test` run. |
| AC14 | Implementation and automated tests supported: `src/request-store.js:56-59` preserves original order; `tests/request-store.test.js:89-115` checks interleaved priorities and counts; existing browser Pass is user-reported. |

## Gaps / not verified

- No substantive mismatch in the active priority-filter implementation was confirmed.
- Fresh end-to-end browser verification was not performed for this review; historical AC1–AC12 and AC14 Pass statements in the specification reflect the user's prior confirmations, not new observations.
- The most important initial test gap: root-level `request-store.test.js` imported `../src/request-store.js`, a location outside the repository. It also expected missing priorities to be automatically set to Normal, unsupported priorities to be rejected by the filter exercise's creation helper, and legacy records to be normalized on load. Those expectations are not the current specification's required filtering behavior.

## Unsupported behavior

None confirmed in the active filter. The specification states that filtering should not infer a priority (`docs/priority-filter-spec.md`, Functional Rules), should preserve all records under All (AC5), and should not repair or migrate stored priority values (Out of Scope). We should not change working application behavior to satisfy stale tests.

## Data or security concerns

- No direct data mutation by changing a filter: `src/app.js:57-63` only renders; storage writes happen upon successful request submission (`src/app.js:36-38`).
- `src/app.js:80` uses `textContent` rather than unsafe HTML insertion for request data.
- This is a local browser-storage exercise, not an authenticated production application, as explicitly scoped by the specification.

## Tests still needed

- Before any later production release, run `npm test` in a fresh clone and perform direct browser smoke testing on saved High/Normal/Low/missing/unknown priority records. The existing test reconstruction and historical user checks do not substitute for a new independent browser observation.
- Keep the corrected root-level tests for unknown/missing priorities and correct import paths; avoid reinstating priority migration assumptions not specified for the filter.

## Most important finding and response

**Finding (confirmed, medium importance):** the root-level `request-store.test.js` was not usable from its location because it imported `../src/request-store.js`; its legacy priority assumptions also conflicted with the Exercise 6 filter requirements.

**Decision: MODIFY.** Accept the test-file path defect, but reject changing the working filter or migrating stored priority data simply to appease outdated assertions. Correct the import to `./src/request-store.js`; update the tests to verify missing and unrecognized priorities remain unchanged and visible under All. Evidence: `docs/priority-filter-spec.md` Functional Rules, AC5, Constraints and Out of Scope; `src/request-store.js:32-59`; revised `request-store.test.js:12,89-123`.

**Result:** no application implementation or specification change. The revised root tests and the other reconstructed tests pass locally (22/22). This assessment is separate from any actual execution of the Codex Skill runner.
