# Priority filter feature specification

## Goal

Help managers identify equipment requests that need attention by displaying requests with a selected priority. Filtering changes visibility only and preserves every request.

## User Need

Managers need to quickly focus on urgent equipment requests without reviewing the entire list or changing existing request information.

## Functional Rules

- Provide a visibly labeled, keyboard-accessible Priority dropdown with options in this order: All, High, Normal, Low. Retain a visible focus indicator.
- On initial page load, select All and display every saved request.
- Changing the selection immediately updates the visible request list without a separate submit action.
- High, Normal, and Low each display only requests whose existing assigned priority matches that selection. Do not infer a priority from other request details.
- Selecting All restores the complete list, including requests with missing or unrecognized priorities.
- Preserve the existing order of requests within each filtered view.
- When a specific priority has no matches, display exactly: "No requests match this priority."
- When All is selected and there are no saved requests, retain the application's existing empty-list behavior.
- Repeatedly selecting a priority or switching between priorities must not create duplicates or change stored data.
- Use the current selection when the request list refreshes during normal application use. A page reload starts with All; persisting the selection is not required.

## Constraints

- Filtering must not change request details, priorities, statuses, or browser storage. It must not delete requests. Existing saved requests must remain readable and available.
- Existing request creation, validation, storage, and other application functionality must continue to work.
- No login, database, external service, framework, build tool, or production dependency is required.
- Keep the application in plain HTML, CSS, and modern JavaScript modules. Keep business and storage logic in `src/request-store.js` and browser interaction and rendering in `src/app.js`.
- Render user-provided content with safe DOM APIs such as `textContent`.

## Acceptance Criteria

Use a disposable browser test dataset containing at least two High requests, one Normal request, one Low request, one request without a priority, and one with an unrecognized priority. Record the complete data and current list order before testing. Use the application's existing priority representation for valid priorities.

Browser results below reflect user confirmations during the guided manual walkthrough and the user's final confirmation that all AC1-AC14 verification tests passed, including AC5's missing/unrecognized-priority edge case. Automated test results do not establish a browser Pass. AC13 records the automated suite separately. Untested criteria do not count as passing.

| ID | Action / condition | Expected observable result | Result |
| --- | --- | --- | --- |
| AC1 | Open the application with the test dataset. | A visibly labeled Priority dropdown contains All, High, Normal, Low in that order; All is selected and every request is visible. | Pass (user-confirmed) |
| AC2 | Select High. | Only the two High requests appear, in their original relative order, with no duplicates. | Pass (user-confirmed) |
| AC3 | Select Normal. | Only the Normal request appears. | Pass (user-confirmed) |
| AC4 | Select Low. | Only the Low request appears. | Pass (user-confirmed) |
| AC5 | Select All after filtering. | Every original request returns, including missing and unrecognized priorities, in the original order. | Pass (user-confirmed) |
| AC6 | With a dataset lacking one valid priority, select that priority. | No request cards appear and the message reads "No requests match this priority." | Pass (user-confirmed) |
| AC7 | Repeatedly select the same priority and switch among all options. | Each view remains correct, with no duplicates; complete stored request data is identical before and after filtering. | Pass (user-confirmed) |
| AC8 | Use an empty dataset; view All, then a specific priority. | All retains the existing empty-list behavior; the specific priority shows "No requests match this priority." | Pass (user-confirmed) |
| AC9 | Navigate to and operate the dropdown using only the keyboard. | The control has a visible label and focus indicator, and selecting an option updates the list. | Pass (user-confirmed) |
| AC10 | Choose a specific priority, then reload the page. | All is selected again and every saved request remains available. | Pass (user-confirmed) |
| AC11 | Create requests and trigger existing validation while a specific filter is active. | Existing creation and validation work; successful requests are saved and appear when they match the selected priority or when All is selected. | Pass (user-confirmed) |
| AC12 | Run the application using its existing local setup. | Filtering works without login or a database; no new production dependencies or external services are introduced. | Pass (user-confirmed) |
| AC13 | Run `npm test` after implementation. | All existing and added business/storage tests pass, including matching, missing/unrecognized priorities, and data preservation. | Pass (equivalent `node --test`; see Verification Results) |
| AC14 | Record the original display order and request data, then switch through All, High, Normal, Low, High, and All. Use multiple requests per valid priority, interleaved in the original list. | At every step, visible requests retain their original relative display order. Returning to All restores the exact original order. Filtering never rearranges, duplicates, or modifies any existing request. After each filter selection, the number of visible request cards must equal the number of original requests matching that selected priority. | Pass (user-confirmed) |

Every acceptance criterion must be checked and documented as Pass or Fail with evidence. Completion requires every criterion to pass, `npm test` to pass, and browser verification of the changed behavior. The implementation summary must identify changed files, tests run, and any remaining limitations.

## Out of Scope

- Assigning or editing priorities, request details, or statuses.
- Sorting by priority, combining filters, searching, or redesigning the interface.
- Accounts, permissions, server storage, or cross-device synchronization.
- Repairing, normalizing, or migrating saved priority values.

## Verification Results

Review date: October 18, 2026.

The specification, request form, and priority filter consistently use the existing values Low, Normal, and High. The filter options are All, High, Normal, Low. The active application is `src/app.js`, loaded by `index.html`; its filtering helper in `src/request-store.js` uses exact matching without sorting, changing priorities, or writing storage. Rendering uses `textContent`. No application code or stored data was changed during this review.

Automated suite executed: `node --test`, the exact command configured by the `npm test` script in `package.json`. Actual result: **22 tests, 22 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo**; exit code 0. The npm launcher itself was not used because it was unavailable in this environment. Nine tests exercise the separate root-level store; the remaining thirteen cover the active application/store, filter options, and startup guidance. Handler tests use DOM doubles and are not browser tests.

User-provided browser evidence: during the guided walkthrough of the corrected application, the user replied "pass" individually for AC1-AC12 and AC14, then explicitly confirmed that all AC1-AC14 manual verification tests passed. This final confirmation resolves the outstanding AC5 missing/unrecognized-priority edge case. These are user-reported results, not independent browser observations by the assistant. AC13 additionally has the actual automated suite evidence recorded above. Earlier file-URL and priority-option failures are historical, not failures of the corrected HTTP application.

| Criterion | Result | Verification evidence |
| --- | --- | --- |
| AC1 | Pass | User confirmed default All, visible Priority label, All/High/Normal/Low option order, complete test list, and counter. |
| AC2 | Pass | User confirmed High filtering, original relative order, no duplicates, and matching counter. Exact count was not supplied. |
| AC3 | Pass | User confirmed the corrected Normal filter shows only Normal requests, once each, in original relative order, with a matching counter. |
| AC4 | Pass | User confirmed Low filtering, original relative order, no duplicates, and matching counter. |
| AC5 | Pass | User's final confirmation covers restoration of every original request, including missing and unrecognized priorities, unchanged and in original order when All is selected. |
| AC6 | Pass | User confirmed the no-match check: no rows, 0 requests, and the exact message "No requests match this priority." Selected priority was not supplied. |
| AC7 | Pass | User confirmed repeated filtering, restored order/count, no duplicates, and the instructed before/after comparison of the complete localStorage value. |
| AC8 | Pass | User confirmed the private-window empty dataset shows the existing empty state under All and the exact no-match message under Normal, with zero rows/count. |
| AC9 | Pass | User confirmed keyboard-only filter operation, visible label and focus outline, and correct list updates. |
| AC10 | Pass | User confirmed reloading from High resets to All and preserves all requests, details, total count, and order. |
| AC11 | Pass | User confirmed required-field validation, successful Normal creation under Normal, successful but hidden High creation under Normal, and both requests appearing once under All with newest first. |
| AC12 | Pass | User confirmed local HTTP operation and High/Normal/All filtering without login, database setup, or external service connection. Prior code review found no added production dependencies. |
| AC13 | Pass | Prior actual automated execution: `node --test`, 22/22 passing, exit code 0. This is the package's test-script command; the npm launcher was unavailable. Tests were not rerun for this documentation-only update. |
| AC14 | Pass | User confirmed the guided interleaved dataset test with two added requests per priority, All/High/Normal/Low/High/All switching, exact matching counts, original relative order, no duplicates, and unchanged complete stored data. |

Final verification status: **AC1-AC14 Pass**, based on the user's confirmed manual results and the automated suite result of **22 passed, 0 failed**. No acceptance criteria remain pending and no failures were reported for the corrected implementation. Tests were not rerun for this documentation-only update; the automated result above is the previously executed suite. This update changes only verification records in this specification; requirements, application code, and saved requests are unchanged.
