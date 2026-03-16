1. Injection & Cross-Site Scripting (XSS)

   [x] SQL Injection: Session validation (header.js)

   [x] SQL Injection: Loading the task list (tasklist.js)

   [x] SQL Injection: Editing tasks (edit.js)

   [x] SQL Injection: Saving tasks (savetask.js)

   [x] SQL Injection: Search function (index.js)

   [x] Stored XSS: Task title and status (tasklist.js)

   [x] Reflected XSS: Edit form (edit.js)

   [x] XSS: User greeting (index.js)

   [x] XSS: Generated HTML search results (index.js)

   [x] XSS: Unfiltered user ID in inline script (backgroundsearch.js)

2. Broken Access Control & Session Management

   [ ] Missing Access Control: No server-side checks for admin routes (index.js)

   [ ] IDOR: Insecure Direct Object Reference in task updates (savetask.js)

   [ ] Session Manipulation: Fake-Login via Cookies (login.js, index.js)

   [ ] Insecure Session Management: Unused express-session middleware (index.js)

   [ ] Hardcoded Secret: Session secret key exposed in code (index.js)

   [ ] Missing Cookie Flags: Missing Secure and HttpOnly flags (login.js, index.js)

3. Broken Cryptography & Data Exposure

   [x] Plaintext Passwords: Stored unencrypted in the database (login.js)

   [x] Sensitive Data Exposure: Password as a hidden field in HTML (users.js)

   [x] Insecure Transport: Credentials sent via URL/GET method (login.js)

   [x] Information Disclosure: Sensitive info in console.log (index.js, tasklist.js)

4. System & Infrastructure Security

   [ ] SSRF: Server-Side Request Forgery via search URL (backgroundsearch.js, search.js)

   [ ] Denial of Service: Connection pool exhaustion (db.js)

   [ ] Missing Security Headers: Helmet middleware not used (index.js)

   [ ] Insecure Container Tags: Use of :latest image tags (compose.yaml, db/Dockerfile)

5. Error Handling & Reliability

   [ ] Error Mishandling: App crashes when DB connection is null (General)

   [ ] Error Mishandling: Failure logic in backgroundsearch.js
