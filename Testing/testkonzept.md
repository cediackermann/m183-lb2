# Testkonzept Sicherheitsanalyse (Phase 2)

## 1. Zielsetzung

Ziel der Tests ist die belastbare Bewertung der aktuellen Sicherheitslage der TODO-Webapplikation einer anderen Gruppe in Phase 2. Der Fokus liegt auf hoher Testabdeckung, nachvollziehbarer Methodik und verwertbaren Ergebnissen fuer die Bewertung.

Es sollen insbesondere folgende Maengel erkannt werden:

- Broken Access Control und fehlende Autorisierungspruefungen
- IDOR/BOLA und unzulaessige Objektzugriffe
- Schwachstellen in Authentifizierung, Session-Handling und MFA
- Injection-Risiken (SQL Injection, XSS)
- CSRF- und Input-Validation-Luecken
- Security Misconfiguration (Header, Cookies, Secrets, Docker/Compose, Debug-Funktionen)
- Geschaeftslogik-Missbrauch und Datenschutzrisiken

## 2. Testgegenstand

Kurze Beschreibung:

- Node.js/Express TODO-Webapplikation mit serverseitigem HTML-Rendering.
- Firebase-basierte Anmeldung (Client), Session-/Rollenpruefung im Backend.
- MariaDB als Datenbank fuer Benutzer-, Rollen- und Task-Daten.

Relevante Komponenten:

- Server und Middleware: server.js, authMiddleware
- Routen: Auth, Tasks, Admin, Search, User, Test
- Controller: Task CRUD, Suche, Rollenverwaltung, Login-Sync
- Views/Frontend: Header/Footer, Login- und Settings-Skripte
- Konfiguration: .env/.env.example, Docker Compose, DB-Schema

Sicherheitsrelevante Funktionen:

- Login, Logout, Auth-Sync
- Rollen-/Berechtigungspruefung (Admin/User)
- Task-Zugriffe pro Benutzer
- Suchfunktion mit Benutzerkontext
- MFA Enrollment/Disable
- Test-/Debug-Funktion zur Rollenverwaltung

## 3. Testumfang

Im Scope:

- Codebasierte Sicherheitsanalyse aller sicherheitskritischen Pfade.
- Verifikation der in Phase 1 behaupteten Verbesserungen gegen den aktuellen Code.
- Pruefung von AuthN/AuthZ, Session, CSRF, SQLi, XSS, Input/Output, Konfiguration und Betriebsaspekten.

Besonders kritisch:

- Auth-Sync und Vertrauenskette Token -> Session -> Autorisierung.
- Rollenverwaltung inkl. Test-/Debug-Routen.
- Objektzugriff auf Task-Objekte (Read/Update/Delete).
- Secrets/Umgebungskonfiguration und produktionsnahe Defaults.

Eingeschraenkt pruefbar:

- Externe Firebase-Policies/IAM ohne direkten Cloud-Zugriff.
- Laufzeitverhalten unter realem Reverse-Proxy/TLS ohne Zielumgebung.

## 4. Testmethodik

Vorgehensmodell:

1. Strukturanalyse und Endpunkt-Mapping
2. Data-Flow-Analyse (Eingaben -> sicherheitskritische Sinks)
3. Verifikationspruefung der Phase-1-Aussagen
4. Negativtests und Missbrauchsszenarien je Kategorie
5. Risikobewertung nach Auswirkung auf Vertraulichkeit, Integritaet, Verfuegbarkeit

Methodenkombination:

- Statische Codeanalyse
- Funktionsorientierte Sicherheitspruefung
- Missbrauchsszenarien und Angriffsdenken
- Orientierung an OWASP Top 10 und CWE-Klassen

## 5. Testkategorien

- Authentifizierung
- Autorisierung und Rollenpruefung
- Session-Management
- IDOR/BOLA
- Eingabevalidierung
- SQL Injection
- XSS (stored/reflected/DOM-relevant)
- CSRF
- Fehlerbehandlung und Information Disclosure
- Cookie-Sicherheit
- HTTP Security Header/CSP
- Brute-Force-Schutz
- MFA-Umsetzung
- Logging/Monitoring sicherheitsrelevanter Events
- Secrets/Environment/Konfiguration
- Docker/Compose/Betriebsmodus
- Geschaeftslogik-Missbrauch

## 6. Testfaelle / Testideen

### 6.1 Authentifizierung

- Ungueltiges oder manipuliertes Token-Cookie senden.
- Erwartung: Session wird nicht privilegiert, Zugriff verweigert.

- Auth-Sync mit inkonsistenten Identitaetsdaten pruefen.
- Erwartung: Keine trust-basierte Uebernahme von Client-UID/Email.

### 6.2 Autorisierung / Rollen

- Nicht-Admin versucht Zugriff auf Admin-Funktionen.
- Erwartung: 403, keine Rollenmutation.

- Test-/Debug-Routen im dev/prod Kontext pruefen.
- Erwartung: Keine unautorisierte Rollenverwaltung.

### 6.3 Session-Management

- Session nach Login auf Regeneration pruefen.
- Erwartung: Neue Session-ID nach erfolgreicher Authentisierung.

- Cookie-Flags in produktionsnahem Betrieb pruefen.
- Erwartung: HttpOnly + Secure + SameSite passend konfiguriert.

### 6.4 IDOR/BOLA

- Fremde Task-ID in Edit/Save/Delete nutzen.
- Erwartung: Zugriff verweigert oder ohne Wirkung.

### 6.5 SQL Injection

- SQL-Payloads in Task-Felder, IDs und Suchbegriffe einbringen.
- Erwartung: Keine Query-Manipulation, keine Datenpreisgabe.

### 6.6 XSS

- Persistente und reflektierte Payloads in darstellbare Felder einbringen.
- Erwartung: Ausgabe bleibt escaped, kein Skriptlauf.

### 6.7 CSRF

- State-changing Requests ohne oder mit falschem Token ausfuehren.
- Erwartung: Request wird abgewiesen.

### 6.8 Brute-Force / Abuse

- Mehrfache Loginversuche und Umgehungsvarianten testen.
- Erwartung: Schutz greift auf dem realen Auth-Pfad.

### 6.9 MFA

- Registrierung/Login mit und ohne MFA testen.
- Erwartung: Keine sicherheitskritische Umgehung, klare Policy.

### 6.10 Logging / Monitoring

- Login-Fehler, Rollenwechsel, CSRF-Verstoesse erzeugen.
- Erwartung: Sicherheitsrelevante Events werden nachvollziehbar protokolliert.

### 6.11 Konfiguration / Secrets / Docker

- Repo und Compose auf Secret-Leaks, unsichere Defaults, Debug-Exposure pruefen.
- Erwartung: Keine echten Secrets im Repo, sichere Standardwerte.

## 7. Priorisierung

| Prioritaet | Fokus                                                          | Ziel                                               |
| ---------- | -------------------------------------------------------------- | -------------------------------------------------- |
| P1         | Access Control, Auth-Sync, Test-/Debug-Routen, Secrets         | Kritische Kompromittierung verhindern              |
| P1         | IDOR/BOLA, CSRF auf write-Endpunkten                           | Unzulaessige Aktionen und Datenzugriffe blockieren |
| P2         | Session-Haertung, MFA-Policy, Brute-Force auf realem Auth-Flow | Konto- und Sitzungsschutz verbessern               |
| P2         | XSS/CSP-Haertung, Input/Output-Konsistenz                      | Defense-in-Depth staerken                          |
| P3         | Logging/Monitoring, strukturelle Governance                    | Nachvollziehbarkeit und langfristige Reife         |

## 8. Testwerkzeuge und Hilfsmittel

- Statische Code-Analyse (IDE, Grep, manuelles Review)
- Browser DevTools (Cookies, Header, CSP, Requests)
- curl/HTTPie oder Burp Suite Repeater (fuer reproduzierbare API- und Endpunkt-Tests / PoCs)
- Firebase Admin SDK Dokumentation (Validierung der Auth-Flows)
- Docker CLI/Compose fuer Betriebs- und Konfigurationspruefung

## 9. Risiken / Grenzen des Tests

- Externe Cloud-Policies (Firebase/IAM) können nur serverseitig (bzw. auf Client-Code Ebene) validiert, aber nicht mit vollem Cloud-Zugang auditiert werden.
- Ohne vollständig konfigurierte produktionsnahe Laufzeitumgebung (z.B. mit Nginx Reverse Proxy) bleiben einzelne Aussagen zu produktivem TLS-Verhalten eingeschraenkt.
- Ergebnisse sind belastbar fuer den zum Testzeitpunkt vorliegenden Code-Stand im Repository.
