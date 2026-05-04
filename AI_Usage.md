# Declaration of AI Usage

## Tools Used

The following AI tools were utilized in this project:

- **Gemini CLI (Antigravity Agent):** Primarily used for codebase analysis, refactoring, and automated fixing of security vulnerabilities.
- **Gemini Web / ChatGPT / Claude:** Used for supplementary explanations of protocol standards (e.g., CSRF details) and for validating security concepts.
- **Claude Code (Anthropic):** Used for static code review and test case generation for another group's project as part of the penetration testing phase. Also used to cross-check the testing team's findings against the actual codebase, implement T-09 (CSP inline style removal), and diagnose deployment issues (missing sessions table, cookie security misconfiguration).

## How and Where was AI applied?

### 1. Error Diagnosis and Debugging

AI was used to diagnose multiple login-related failures during development and deployment. This included analyzing the **Login Redirect Loop** and **ForbiddenError (EBADCSRFTOKEN)** by reviewing the middleware sequence in `server.js`, identifying that the CSRF protection was blocking the session synchronization process. During deployment, a second loop was diagnosed by cross-referencing Docker logs, `.env`, and `compose.yaml`, uncovering two root causes: the `sessions` table was missing from the MariaDB schema (causing session persistence to silently fail), and `NODE_ENV=production` was hardcoded in `compose.yaml`, forcing `secure: true` on the session cookie which browsers reject over plain HTTP.

### 2. Implementation of Security Fixes (T-xx Requirements)

AI assisted in locating and implementing the security requirements (T-01 to T-12) defined in the test report (`Testing/testbericht.md`):

- **T-07 (Audit Logging):** Creation and integration of `auditLogger.js`.
- **T-08 (MFA):** Correct extraction of MFA claims from the Firebase token within the middleware.
- **T-09 (CSP):** Full removal of `'unsafe-inline'` from the `style-src` directive. AI performed a codebase-wide scan across all JS controllers and view partials to identify every inline `<style>` tag and `style=""` attribute, then extracted them into `/public/css/auth.css` and `/public/css/style.css`, replacing inline style manipulation in `login.js` and `settings.js` with CSS class toggling (`.hidden`, `.error-msg`, etc.).

### 3. Cross-Checking the Testing Team's Report

AI was used to verify the testing team's findings (`Testing/testbericht.md`) against the actual code. For each of the 12 findings, the AI read the cited source files and line numbers, then compared the described behaviour with the real code to identify inaccuracies. Confirmed inconsistencies included: the T-01 PoC ignoring the global CSRF middleware (rendering it incomplete), incorrect line number references in T-01/T-03/T-07, T-04 overstating the privilege impact (the `INSERT` hardcodes `roleID = 2`, not admin), T-08 mislabelling an optional registration step as a "server-side bypass", and T-11 being a duplicate of T-01's root cause.

### 4. Static Security Review and Test Case Generation (secure-node-app-GaRa)

AI was used extensively during the penetration testing phase of another group's Node.js/Express application (`secure-node-app-GaRa`). The AI's role covered two distinct areas, both documented in `TESTPLAN.md` of that repository:

**Test Case Generation:** AI generated all 44 test cases (TC-01 through TC-44) covering authentication, authorization, session handling, input validation, CSRF, brute-force protection, MFA, and infrastructure configuration. Every generated test case was then manually executed and validated by the team — cases that were not applicable to the target app were removed.

**Static Code Analysis:** AI performed a line-by-line white-box review of the entire codebase (`todo-list-node/`, `docker/` and infrastructure configs), producing 13 documented findings (AICR-01 through AICR-13):

| ID      | Finding                                        | Severity      |
| ------- | ---------------------------------------------- | ------------- |
| AICR-01 | Latent DOM-XSS sink in client-side search      | High          |
| AICR-02 | Brute-force counters lost on process restart   | Medium        |
| AICR-03 | MemoryStore sessions not production-safe       | Medium        |
| AICR-04 | Missing HSTS header                            | Medium        |
| AICR-05 | No database connection pooling                 | Medium        |
| AICR-06 | TOTP token replay vulnerability                | Medium        |
| AICR-07 | Weak AES key derivation                        | Low           |
| AICR-08 | IP counter not cleared on successful login     | Low           |
| AICR-09 | No UNIQUE constraint on username               | Low           |
| AICR-10 | No foreign key constraints                     | Low           |
| AICR-11 | Abandoned `speakeasy` library still referenced | Low           |
| AICR-12 | Test methodology clarification                 | Informational |
| AICR-13 | UTF-8 charset limitations                      | Informational |

Each finding includes precise code references, an explanation of the vulnerability, and a concrete remediation recommendation.

### 5. Data Privacy Cleanup (PII)

Based on AI recommendations, sensitive data (email addresses) was removed from the audit logs to comply with data protection regulations (GDPR).

## Justification of Decisions

### Why was AI used?

- **Efficiency in Repetitive Tasks:** Searching for patterns (e.g., all `T-xx` comments, all inline styles) across multiple files is manually error-prone. AI completes this task in seconds with full coverage.
- **Cross-Codebase Review:** Reviewing an unfamiliar codebase for security issues benefits from AI assistance, as it can trace data flows across files (e.g., from route handler to controller to database query) without losing context.
- **Complexity Management:** The interaction between session regeneration, CSRF tokens, and Firebase Auth is complex. AI served as a "sparring partner" to more quickly understand side effects such as the redirect loop.
- **Standardization:** AI provided idiomatic solution proposals for Express middleware that align with industry best practices.

### Why was AI avoided or manually corrected in certain cases?

- **Manual Validation of Critical Logic:** Although AI generated the SQL statements for T-10 (role validation), the actual enforcement of foreign keys in `db/m183_lb2.sql` was manually reviewed to ensure database integrity is guaranteed at the engine level (MariaDB/InnoDB).
- **Correction of Hallucinations:** During development, an erroneous removal of `cookie-parser` by the AI was noticed and manually corrected. The AI had falsely assumed that `express-session` would already completely replace it internally.
- **Architectural Control:** The decision to place the CSRF middleware _after_ the initial auth routes was made after a manual risk assessment to balance user experience (UX) against security.

## Conclusion

AI was used as a highly efficient tool for analyzing and implementing technical requirements. However, architectural responsibility and the final validation of security concepts remained with the developer to ensure the correctness and consistency of the overall system.
