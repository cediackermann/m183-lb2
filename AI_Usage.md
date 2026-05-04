# Declaration of AI Usage

## Tools Used

The following AI tools were utilized in this project:

- **Gemini CLI (Antigravity Agent):** Primarily used for codebase analysis, refactoring, and automated fixing of security vulnerabilities.
- **Gemini Web / ChatGPT / Claude:** Used for supplementary explanations of protocol standards (e.g., CSRF details) and for validating security concepts.

## How and Where was AI applied?

### 1. Error Diagnosis and Debugging

AI was specifically used to analyze the **Login Redirect Loop** and the **ForbiddenError (EBADCSRFTOKEN)**. Through automated analysis of the middleware sequence in `server.js`, the AI quickly identified that the CSRF protection was blocking the session synchronization process.

### 2. Implementation of Security Fixes (T-xx Requirements)

The AI assisted in locating and efficiently implementing the security requirements (T-01 to T-12) defined in the test report (`Testing/testbericht.md`):

- **T-08 (MFA):** Correct extraction of MFA claims from the Firebase token within the middleware.
- **T-07 (Audit Logging):** Creation and integration of `auditLogger.js`.
- **T-09 (CSP):** Generation of the `helmet` configuration using dynamic nonces.

### 3. Data Privacy Cleanup (PII)

Based on AI recommendations, sensitive data (email addresses) was removed from the audit logs to comply with data protection regulations (GDPR).

## Justification of Decisions

### Why was AI used?

- **Efficiency in Repetitive Tasks:** Searching for patterns (e.g., all `T-xx` comments) across multiple files is manually error-prone. The AI completes this task in seconds with full coverage.
- **Complexity Management:** The interaction between session regeneration, CSRF tokens, and Firebase Auth is complex. The AI served as a "sparring partner" to more quickly understand side effects (such as the redirect loop).
- **Standardization:** The AI provided idiomatic solution proposals for Express middleware that align with industry best practices.

### Why was AI avoided or manually corrected in certain cases?

- **Manual Validation of Critical Logic:** Although the AI generated the SQL statements for T-10 (role validation), the actual enforcement of foreign keys in `db/m183_lb2.sql` was manually reviewed to ensure database integrity is guaranteed at the engine level (MariaDB/InnoDB).
- **Correction of Hallucinations:** During development, an erroneous removal of the `cookie-parser` by the AI was noticed and manually corrected. The AI had falsely assumed that `express-session` would already completely replace it internally.
- **Architectural Control:** The decision to place the CSRF middleware _after_ the initial auth routes was made after a manual risk assessment to balance user experience (UX) against security.

## Conclusion

The AI was used as a highly efficient tool for analyzing and implementing technical requirements. However, architectural responsibility and the final validation of security concepts remained with the developer to ensure the correctness and consistency of the overall system.
