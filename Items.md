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

   [x] Stored XSS: Unsanitized database outputs used in admin/users.js

   [x] Stored XSS in Search: search/v2/index.js returns unsanitized row.title and row.state

2. Broken Access Control & Session Management

   [x] Missing Access Control: No server-side checks for admin routes (app.js)

   [x] IDOR: Insecure Direct Object Reference in task updates (savetask.js)

   [x] Session Manipulation: Fake-Login via Cookies (login.js, app.js)

   [x] Insecure Session Management: Unused express-session middleware (app.js)

   [x] Hardcoded Secret: Session secret key exposed in code (app.js)

   [x] Missing Cookie Flags: Missing Secure and HttpOnly flags (login.js, app.js)

   [x] CSRF (Cross-Site Request Forgery): Missing CSRF tokens across all forms.

   [x] Bruteforce / Rate Limiting: No protection against bruteforce attacks on the /login route.

3. Broken Cryptography & Data Exposure

   [x] Plaintext Passwords: Stored unencrypted in the database (login.js)

   [x] Sensitive Data Exposure: Password as a hidden field in HTML (users.js)

   [x] Insecure Transport: Credentials sent via URL/GET method (login.js)

   [x] Information Disclosure: Sensitive info in console.log (index.js, tasklist.js)

   [x] Hardcoded DB Credentials: Hardcoded password and user in config.js

4. System & Infrastructure Security

   [x] SSRF: Server-Side Request Forgery via search URL (backgroundsearch.js, search.js)

   [x] Denial of Service: Connection pool exhaustion (db.js)

   [x] Missing Security Headers: Helmet middleware not used (index.js)

   [x] Insecure Container Tags: Use of :latest image tags (compose.yaml, db/Dockerfile)

5. Error Handling & Reliability

   [x] Error Mishandling: App crashes when DB connection is null (General)

   [x] Error Mishandling: Failure logic in backgroundsearch.js
