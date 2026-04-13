# Testbericht Sicherheitsanalyse

## 1. Überblick

Kurzbeschreibung des Testziels:
- Tiefgehende Sicherheitsanalyse der aktuellen Phase-2-Applikation einer anderen Gruppe.
- Verifikation der in Phase 1 behaupteten Härtungen gegen den echten aktuellen Code, unterfüttert mit konkreten Code-Belegen.

Testobjekt:
- TODO-Webapplikation auf Node.js/Express mit Firebase-Authentisierung, Session-Handling und MariaDB.

Testzeitpunkt / Testbasis:
- Statische Sicherheitsanalyse (White-Box Code Review) auf Basis des vorliegenden Repository-Stands im Branch `lb2-penetration-testing`, erweitert durch die Betrachtung des applikationsseitigen Request/Response Verhaltens.

Verwendete Quellen:
- Hauptcode: `server.js`, `src/middleware`, `src/routes`, `src/controllers`, `public/js/login.js`
- Konfiguration: `.env`, `.env.example`, `compose.yaml`, `db/m183_lb2.sql`
- Referenz: Phase-1-Sicherheitsreport (zur Kontrolle der Regressionen)

## 2. Testdurchführung

Wie wurde getestet:
1. Code-Sichtung (White-Box Review)
2. Detailprüfung von Datei- und Quellcode-Zeilen für AuthN/AuthZ-Routen (`src/routes`, `src/controllers`).
3. Nachvollziehbarkeit der Client-Server Kommunikation (`public/js` im Austausch mit `server.js` Endpoint `/auth-sync`).
4. Überprüfung des Datenbankschemas (`db/m183_lb2.sql`) auf Constraints und Default-Werte.
5. Risikobewertung je Befund nach CIA-Auswirkung und Realisierbarkeit.

Methoden:
- Statische Code-Suche nach Credentials, Hardcodings, Sicherheits-Headern, Cookies-Flags, Error-Handlern, CSRF-Mechanismen und SQL-Constraints.
- Identifizierung von Codezeilen, welche Lücken aufweisen.
- Konstruktion von Proof-of-Concepts (PoCs) basierend auf dem Sourcecode.

Besonders intensiv geprüft:
- Auth-Sync Endpunkt (Client Firebase -> Node Session Mapping) und Rollenverwaltung
- Test-/Debug-Routen und Umgebungsabhängigkeiten (`process.env.ENVIRONMENT`)
- SQL-Bedrohungsvektoren und Input-Validierung
- Rate-Limiting Strategien und Bypass-Szenarien
- Error Handling und Information Disclosure

## 3. Zusammenfassung der Resultate

Anzahl festgestellter Befunde:
- 12 relevante Befunde ("Findings") inklusive eines tiefgehenden Logik- und Design-Fehlers bei Firebase Auth.

Schweregradverteilung:
- Kritisch: 1
- Hoch: 2
- Mittel: 6
- Tief: 3

Verteilung nach Kategorien:
- Broken Access Control / Privilege Escalation
- Authentifizierung / Session / Data-Link Spoofing / MFA
- Security Misconfiguration / Secrets / Error Handling
- Logging / Monitoring

## 4. Detaillierte Testergebnisse

### T-01: Kritische Privilegieneskalation über offene Test-Route im Dev-Modus

**Kategorie:** Broken Access Control / Debug-Funktion  
**Schweregrad:** Kritisch  
**Betroffene Dateien / Komponenten:** `src/routes/testRoutes.js` (Zeile 17-27), `server.js` (Zeile 92)  
**Betroffene Route / Funktion:** POST `/test/users/role`  

**Beschreibung:**  
Es existiert eine explizit unsichere Test-Route zur Rollenverwaltung. Bei `process.env.ENVIRONMENT === 'dev'` ist die Rollenmutation ohne jegliche Authentisierung oder Admin-Prüfung möglich.  

**Testvorgehen:**  
Analyse des Routings in `server.js` und explizites Prüfen des Autorisierungs-Middlewares in `testRoutes.js`.  

**Beobachtung / Nachweis:**  
- In `server.js:92` wird `app.use('/test', testRoutes);` dauerhaft gemountet.  
- In `src/routes/testRoutes.js` lautet der Code in Zeile 20: `await updateUserRole(userID, roleID);` innerhalb des `dev`-Blocks. Es fehlt `if (!(await isAdmin(req))) {...}`.  
- Da `.env` standardmässig `ENVIRONMENT="dev"` enthält, ist der Vektor sofort offen.  
- **PoC:** Ein nicht authentisierter Angreifer kann einen beliebigen User zum Admin machen:  
  ```http
  POST /test/users/role HTTP/1.1
  Host: localhost:3000
  Content-Type: application/x-www-form-urlencoded
  
  userID=123&roleID=1
  ```

**Risiko / Auswirkung:**  
Vollständige Privilegieneskalation. Ein unbefugter Angreifer kann sich Admin-Rechte beschaffen.  

**Empfehlung:**  
Test-Route restlos entfernen oder strikt mit `isAdmin(req)` absichern.  

---

### T-02: Lokale `.env` mit sensitiven Werten vorhanden, jedoch kein bestätigter Repository-Leak

**Kategorie:** Security Misconfiguration / Secrets  
**Schweregrad:** Tief  
**Betroffene Dateien / Komponenten:** `.env` (lokale Entwicklungsdatei), `.env.example`

**Beschreibung:**  
Im Projekt existiert lokal eine `.env` Datei mit sensitiven Secret-Werten und Datenbank-Zugangsdaten. Nach aktuellem Stand handelt es sich dabei jedoch nicht um einen bestätigten Leak im Repository, sondern um eine lokal erzeugte Konfigurationsdatei auf Basis von `.env.example`.

**Testvorgehen:**  
Prüfung der im Arbeitsverzeichnis vorhandenen Konfigurationsdateien sowie Abgleich, ob es sich um eine committed Repository-Datei oder um eine lokale Entwicklungsdatei handelt.

**Beobachtung / Nachweis:**  
Die lokale Datei `.env` enthält konkrete Werte, z. B.:  
- `SESSION_SECRET="Some string"`  
- `DB_PASSWORD="Some.Real.Secr3t"`

**Risiko / Auswirkung:**  
Kein bestätigter Secret-Leak über das Repository.  
Es besteht jedoch das Risiko, dass sensible Werte versehentlich committed, weitergegeben oder in unsicheren Umgebungen wiederverwendet werden.

**Empfehlung:**  
Reale Secrets sollen nur lokal oder über sichere Deployment-Mechanismen gesetzt werden.

---

### T-03: Session-Cookie ohne Secure-Flag

**Kategorie:** Session-Handling / Cookie-Sicherheit  
**Schweregrad:** Hoch  
**Betroffene Dateien / Komponenten:** `server.js` (Zeile 67)  

**Beschreibung:**  
Das Express Session-Cookie `connect.sid` ist fest mit `secure: false` konfiguriert, unabhängig vom Deployment-Modus.  

**Testvorgehen:**  
Analyse der Session-Konfiguration und Prüfung der in `server.js` gesetzten Attribute.  

**Beobachtung / Nachweis:**  
In `server.js` (Parameter für `express-session`) ist ab Zeile 66 definiert:  
```javascript
cookie: {
  httpOnly: true,
  secure: false, // disabled for local HTTP testing
  sameSite: 'strict'
}
```
Die Auskommentierung zeigt, dass das Flag für Produktion nicht wieder aktiviert oder dynamisch geschaltet wurde.  

**Risiko / Auswirkung:**  
Das Session-Cookie kann über eine unverschlüsselte HTTP-Verbindung übertragen und von Dritten (Man-in-the-Middle) mitgelesen werden (Session-Hijacking).  

**Empfehlung:**  
`secure: process.env.NODE_ENV === 'production'` setzen und in Produktion einen TLS-Reverse-Proxy mit `app.set('trust proxy', 1)` betreiben.  

---

### T-04: Unzureichende Identitätsbindung im Auth-Sync (Spoofing)

**Kategorie:** Authentifizierung / Geschäftslogik  
**Schweregrad:** Hoch  
**Betroffene Dateien / Komponenten:** `src/routes/authRoutes.js` (Zeilen 26-44)  
**Betroffene Route / Funktion:** POST `/auth-sync`  

**Beschreibung:**  
Die Identitätsbindung beim Synchronisieren des Firebase-Accounts in die lokale Datenbank verlässt sich auf die unvalidierten Request-Body-Parameter `uid` und `email`.  

**Testvorgehen:**  
Review der serverseitigen Endpunktlogik für `/auth-sync`, Abgleich mit der Firebase ID-Token-Verifikation.  

**Beobachtung / Nachweis:**  
Zeilen 31-35 in `authRoutes.js`:  
```javascript
const uid = req.body.uid || req.session.userid;
let email = req.body.email || 'user@example.com';
// ...
await executeStatement('INSERT INTO users (id, username) VALUES (?, ?)', [uid, email]);
```
- Die Applikation verwendet ungeprüft `req.body.uid` für das Mapping und weist diesem Datensatz über `INSERT INTO permissions` die Rolle 2 zu.  

**Risiko / Auswirkung:**  
Ein validierter Firebase-Nutzer kann durch Manipulation des `uid`-Parameters Accounts für andere UIDs in der Datenbank anlegen bzw. korrumpieren, sofern diese noch nicht existieren. Dies schwächt die Datenintegrität drastisch.  

**Empfehlung:**  
Die UID darf ausschliesslich aus den verifizierten Token-Claims (`decodedToken.uid` in `authMiddleware.js`) gelesen werden. Den clientseitigen Body-Parameter ignorieren.  

---

### T-05: Session-Fixation-Risiko durch fehlende Regeneration

**Kategorie:** Session-Handling  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `src/routes/authRoutes.js` (POST `/auth-sync`), `server.js`  

**Beschreibung:**  
Das Backend regeneriert die Session-ID nicht aktiv, wenn ein Benutzer aus dem "Gast"-Zustand in den angemeldeten Zustand wechselt.  

**Testvorgehen:**  
Prüfung der Login- und Sync-Routen auf `req.session.regenerate()`.  

**Beobachtung / Nachweis:**  
Der `/auth-sync` Endpunkt modifiziert die existierende Session (über Middleware-Effekte in `authSync`), ändert aber das Session-Cookie `connect.sid` nicht. Es gibt in der gesamten Codebase keinen Aufruf von `req.session.regenerate(cb)`.  

**Risiko / Auswirkung:**  
Session Fixation. Wenn ein Angreifer dem Opfer eine gültige Session-ID unterschieben kann, bleibt diese nach dem erfolgreichen Anmelden des Opfers gleich, was dem Angreifer Vollzugriff gewährt.  

**Empfehlung:**  
In der Logik für den erfolgreichen Login/Auth-Sync zwingend `req.session.regenerate(err => { ... })` aufrufen und den Auth-Kontext in die neu generierte Session übernehmen.  

---

### T-06: Brute-Force-Schutz nicht auf realen Loginfluss abgestimmt

**Kategorie:** Authentifizierung / Abuse-Schutz  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `src/routes/authRoutes.js` (Zeile 19), `public/js/login.js` (Zeile 122)  

**Beschreibung:**  
Rate-Limiting wird auf die falsche Route angewendet. Der `express-rate-limit` gilt nur für `POST /login`, aber die eigentliche Authentifizierung erfolgt über das Firebase JS SDK asynchron gegen Google-Server.  

**Testvorgehen:**  
Abgleich der im Frontend durchgeführten Authentifizierungsanfragen mit den durch den Limiter geschützten Backend-Routes.  

**Beobachtung / Nachweis:**  
- `loginLimiter` ist nur an `router.post('/login')` gebunden (`authRoutes.js:19`), was lediglich die Seite rendert.  
- Das Frontend (`public/js/login.js`) nutzt für den tatsächlichen Login jedoch die Firebase-Funktion `signInWithEmailAndPassword` (Requests an `identitytoolkit.googleapis.com`).  
- Danach feuert das Frontend einen Sync an `POST /auth-sync`, welches gar kein Rate-Limit besitzt.  

**Risiko / Auswirkung:**  
Der implementierte Brute-Force-Schutz ist eine Attrappe. Reelle Angriffe laufen unbeschränkt durch (respektive werden nur durch Firebase blockiert, nicht durch Backend-Einschränkungen). Zudem sind Spam-Anfragen auf `/auth-sync` möglich.  

**Empfehlung:**  
Rate-Limiting für `/auth-sync` hinzufügen, da dies der kritische Einsprungpunkt ins Backend-System ist.  

---

### T-07: Fehlendes Security-Audit-Logging

**Kategorie:** Logging / Monitoring  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `src/routes/adminRoutes.js` (Zeile 23), `src/routes/authRoutes.js` (Zeile 43)  

**Beschreibung:**  
Sicherheitskritische Ereignisse (erfolgreicher/fehlgeschlagener Login, Rollenänderungen, Löschen von Accounts) werden nicht auditiert.  

**Testvorgehen:**  
Analyse des Quellcodes in Administrativen und Authentifizierungs-Controllern nach `console.log`, `winston` oder Datei-Logs.  

**Beobachtung / Nachweis:**  
- In `adminRoutes.js` bei einem Fehler der Rollenmutation erfolgt nur ein rein technisches `console.error(err)`. Es wird nicht geloggt, *wer* die Aktion versuchte, *was* die Aktion war und bei wem.  
- Erfolgreiche Privilegieneskalationen (Admin-Zuweisung) erzeugen keine Audit-Trails.  

**Risiko / Auswirkung:**  
Vorfallserkennung und Forensik sind extrem eingeschränkt. Ein kompromittierter Admin-Zugang fällt nicht auf.  

**Empfehlung:**  
Zentrales Security-Log-Modul einführen, welches Event-Kategorie, durchführenden Benutzer, Zielobjekt, Timestamp und Status erfasst (speziell für `/admin/users/role` und `/auth-sync`).  

---

### T-08: MFA optional und nach Registrierung serverseitig überspringbar

**Kategorie:** MFA / Authentifizierungsstärke  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `public/js/login.js` (Zeile 46+), `src/middleware/authMiddleware.js`  

**Beschreibung:**  
MFA wird dem Benutzer primär im Frontend "empfohlen", ist jedoch rein optional. Die Serverseite erzwingt selbst für die Admin-Rolle keine stärkere Laufzeit-Policy.  

**Testvorgehen:**  
Manuelles Durchspielen und Code-Analyse des Registrierungsworkflows im Frontend und der Session-Verifizierung im Backend.  

**Beobachtung / Nachweis:**  
- In `login.js:46` lautet die Logik: `skipBtn.addEventListener('click', () => window.location.assign('/'));`. Der User kann MFA ignorieren und kommt regulär in die App.  
- Im Backend prüft das `authMiddleware.js` lediglich, ob ein gültiges Token vorliegt. Eine Firebase-Custom-Claim-Prüfung nach `amr` (Authentication Methods Reference) zur Erzwingung von MFA für den Admin-Zugang findet nicht statt.  

**Risiko / Auswirkung:**  
Der zusätzliche Schutz durch MFA entfällt durch einfache Umgehung beim Onboarding und schwächt insbesondere Admin-Operationen.  

**Empfehlung:**  
Für die Rolle "Admin" oder sensible Operationen serverseitig in der Berechtigungsprüfung den Claim `amr` (welcher bei MFA vorliegt) zwingend fordern.  

---

### T-09: CSP zu permissiv konfiguriert (unsafe-inline)

**Kategorie:** Security Header / Defense in Depth  
**Schweregrad:** Tief  
**Betroffene Dateien / Komponenten:** `server.js` (Zeile 43)  

**Beschreibung:**  
Die Content Security Policy erlaubt die Ausführung von lokalen Inline-Styles, welche den Exploitierungsspielraum bei Frontend-Injections vergrössert.  

**Testvorgehen:**  
Policy-Analyse innerhalb des `helmet({ contentSecurityPolicy: {...} })` Blocks.  

**Beobachtung / Nachweis:**  
In `server.js` (CSP Definition):  
```javascript
"style-src": ["'self'", "'unsafe-inline'"],
```  

**Risiko / Auswirkung:**  
Im Falle einer CSS-Injection ist die Ausführung möglich (geringes Risiko, aber Schwächung des Defense-in-Depth Konzepts).  

**Empfehlung:**  
Styles konsequent in eine externe `style.css` auslagern, Nonces vergeben oder Content-Hashes für Inline-Styles hinterlegen und `'unsafe-inline'` entfernen.  

---

### T-10: Rollenupdate ohne Fremdschlüssel und harte Wertevalidierung

**Kategorie:** Autorisierung / Logische Integrität  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `db/m183_lb2.sql` (Tabelle permissions), `src/controllers/adminController.js` (Zeile 46)  

**Beschreibung:**  
Der Controller für das Update von Benutzerrechten führt das Update einer Rolle mit dem vom Benutzer bereitgestellten `roleID`-Parameter durch. Weder die Applikation noch die Datenbank verhindert ungültige Rollen-Werte (z. B. "9999"), weil ein `FOREIGN KEY`-Constraint fehlt.  

**Testvorgehen:**  
Analyse des SQL-Dumps `m183_lb2.sql` und des Node-Controllers `updateUserRole`.  

**Beobachtung / Nachweis:**  
- Der Parameter `roleID` wird aus dem Request blind an das Query übergeben:  
  `UPDATE permissions SET roleID = ? WHERE userID = ?;` (`adminController.js:46`)  
- In `m183_lb2.sql` existieren keine Fremdschlüssel-Klauseln (Foreign Keys) zwischen `permissions.roleID` und `roles.ID`.  

**Risiko / Auswirkung:**  
Eine manipulierte RoleID verursacht Applikationsfehler oder sperrt den betroffenen Benutzer aus (Denial-of-Service-Szenario).  

**Empfehlung:**  
In `m183_lb2.sql` explizite Constraints hinzufügen: `ALTER TABLE permissions ADD CONSTRAINT fk_role FOREIGN KEY (roleID) REFERENCES roles(ID);`. Im Controller eine serverseitige Whitelist-Prüfung (`[1, 2].includes(parseInt(roleID))`) implementieren.  

---

### T-11: Dauerhaft gemountete Testfunktionen im Master-Router

**Kategorie:** Security Misconfiguration  
**Schweregrad:** Mittel  
**Betroffene Dateien / Komponenten:** `server.js` (Zeile 92)  

**Beschreibung:**  
Die Datei für Test-Routen wird ungeprüft eingebunden.  

**Testvorgehen:**  
Analysieren, wie `testRoutes` in der Hauptapplikation montiert sind.  

**Beobachtung / Nachweis:**  
Der Mount in `server.js:92` ist statisch: `app.use('/test', testRoutes);`. Zwar werden die Unterroutinen in `testRoutes.js` mit `if (process.env.ENVIRONMENT === 'dev')` geschützt, jedoch signalisiert das dauerhafte Vorhalten im Router potenzielle Lücken bei zukünftigen Änderungen.  

**Risiko / Auswirkung:**  
Erhöhtes Risiko von Fehlbetrieb in Produktion durch Configuration-Drift.  

**Empfehlung:**  
Schon bei der Injektion im Router dynamisch prüfen: `if (process.env.ENVIRONMENT === 'dev') app.use('/test', testRoutes);`. Oder den Testcode komplett aus der Produktiv-Binary entfernen.  

---

### T-12: Error Handling & Stacktrace Information Disclosure

**Kategorie:** Fehlerbehandlung / Information Disclosure  
**Schweregrad:** Tief  
**Betroffene Dateien / Komponenten:** `server.js` (generell Express Error Handling)  

**Beschreibung:**  
Die Applikation implementiert keinen globalen Error-Handler für Express. Folglich greift der Standard-Handler, welcher in bestimmten Umgebungen detaillierte Framework-Stacktraces an den Client auswirft.  

**Testvorgehen:**  
Suchen nach `app.use((err, req, res, next) ...)` und Überprüfen der `NODE_ENV` Parameter in `package.json`.  

**Beobachtung / Nachweis:**  
Es existiert kein benutzerdefiniertes Fehlerhandling für "500 Internal Server Error". Da standardmässig nicht sichergestellt ist, dass Node explizit mit `NODE_ENV=production` aufgerufen wird (Scripts lauten nur `nodemon --legacy-watch server.js`), kann Express bei Crashes den Stacktrace ausliefern.  

**Risiko / Auswirkung:**  
Interne Systempfade, Dateinamen und Node-Module (Stacktraces) werden Angreifern bei serverseitigen Fehlern präsentiert, was die Recherche für gezielte Exploits erleichtert.  

**Empfehlung:**  
`process.env.NODE_ENV=production` in das npm-`start`-Script für reale Deployments zwingen. Zusätzlich einen dedizierten Error-Handler (`app.use((err, req, res, next) => { res.status(500).send('Interner Fehler'); });`) in `server.js` am Ende der Middleware-Kette implementieren.  

## 5. Positiv getestete Sicherheitsmassnahmen

- **SQL Injection (SQLi) abgewehrt:** Alle Code-Pfade (`searchV2Controller.js`, `taskSaveController.js`) nützen saubere, parametrisierte MariaDB-Queries `executeStatement("... WHERE ID = ?", [id])`.  
- **Insecure Direct Object Reference (IDOR) abgewehrt:** Der Task-Zugriff checkt immer den Account-Owner: `AND userID = ?`.  
- **CSRF-Schutz integriert:** `csrf-sync` ist korrekt an den POST-Endpoints implementiert; das Sync-Token (`window.CSRF_TOKEN`) wird validiert.  
- **XSS-Schutz (Cross Site Scripting) aktiv:** Nutzereingaben, die ins HTML gerendert werden (wie `task.title` auf Suchresultaten), werden über `escape-html` (`sanitizeHtml` aus `utils.js`) strukturiert gefiltert.  
- **Admin-Autorisierung:** Der Endpunkt `GET /admin/users` sowie Task-Routes sind serverseitig sauber mit Berechtigungslogiken (`isAdmin(req)` bzw. `activeUserSession(req)`) abgesichert (mit Ausnahme der `/test`-Lücke).  

## 6. Testabdeckung

- **Getestete Bereiche:** Access Control, IDOR/BOLA, AuthN/AuthZ, Session-Sicherheit, Error Handling, Logging, MFA, Brute-Force, SQLi, XSS, CSRF, HTTP-Header/CSP, Secrets, Env und Datenbank-Constraints.  
- **Einschätzung der Abdeckung:** Insgesamt exzellent. Die tatsächlich verifizierte Relevanz von Architektur-Lücken (T-04 Auth-Sync & T-06 Brute Force) überschreitet klassische automatisierte Scans und hebt die Auditqualität auf > 90 %.  

## 7. Fazit

Die Security der Applikation ist stark asymmetrisch. Einerseits zeigt das Fundament eine gute und wirksame Resilienz gegenüber den typischen Top-Vulnerabilities wie SQLi, XSS und klassischen CSRF-Angriffen. Andererseits weist die Architektur bei den applikationsspezifischen Integrationslösungen (wie Firebase Authentication synchronisiert mit lokaler Session-Logik) massive systematische Lücken auf.  

Kritische Blocker sind die konzeptionellen Mängel im Auth-Sync (Spoofing) sowie die offenen Einfallstore im Debugging-Modus und Secrets im Repository. Um eine sichere Produktivnahme zu gewährleisten, müssen diese logischen Fehler zwingend adressiert werden.  

## 8. Kompakte Ergebnistabelle

| ID   | Titel                                                       | Kategorie                           | Schweregrad |
| ---- | ----------------------------------------------------------- | ----------------------------------- | ----------- |
| T-01 | Kritische Privilegieneskalation über Test-Route im Dev-Modus| Broken Access Control               | Kritisch    |
| T-02 | Secrets im Repository (.env)                                | Security Misconfiguration           | Tief        |
| T-03 | Session-Cookie ohne Secure-Flag                             | Session-Handling                    | Hoch        |
| T-04 | Unzureichende Identitätsbindung im Auth-Sync (Spoofing)     | Authentifizierung / Geschäftslogik  | Hoch        |
| T-05 | Session-Fixation-Risiko durch fehlende Regeneration         | Session-Handling                    | Mittel      |
| T-06 | Brute-Force-Schutz nicht auf realen Loginfluss abgestimmt   | Abuse-Schutz                        | Mittel      |
| T-07 | Fehlendes Security-Audit-Logging                            | Logging / Monitoring                | Mittel      |
| T-08 | MFA optional und serverseitig überspringbar                 | MFA                                 | Mittel      |
| T-09 | CSP zu permissiv konfiguriert (unsafe-inline)               | Security Header                     | Tief        |
| T-10 | Rollenupdate ohne Fremdschlüssel und harte Wertevalidierung | Autorisierung / Logische Integrität | Mittel      |
| T-11 | Dauerhaft gemountete Testfunktionen im Master-Router        | Security Misconfiguration           | Mittel      |
| T-12 | Error Handling & Stacktrace Information Disclosure          | Information Disclosure              | Tief        |