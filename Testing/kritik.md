# Kritik am Testbericht und Testkonzept

## 1. Allgemeines

Der Bericht ist formal gut strukturiert und zeigt ein sorgfältiges White-Box-Review. Dennoch gibt es methodische, inhaltliche und formale Schwächen, die die Aussagekraft einschränken.

---

## 2. Methodische Schwächen

### 2.1 Rein statische Analyse – kein dynamisches Testing

Das gesamte Testing basiert auf Codereview (White-Box). Es wurden keine echten HTTP-Requests gegen eine laufende Instanz ausgeführt. Der einzige "PoC" in T-01 ist ein theoretisches `curl`-Beispiel, das offensichtlich nie tatsächlich ausgeführt wurde. Ein Penetrationstest ohne Live-Ausführung des Exploits bleibt eine Vermutung, kein Beweis.

**Konkret:** Für T-01 (kritische Privilegieneskalation) fehlt ein Screenshot oder Response-Dump, der bestätigt, dass der Angriff gegen die laufende App funktioniert hat.

### 2.2 Fehlende Traceability zwischen Testkonzept und Testbericht

Das Testkonzept definiert 11 Testkategorien (6.1–6.11) mit konkreten Testfällen. Der Testbericht mappt die 12 Findings jedoch nicht auf diese Testfälle. Es ist unklar, welche Testideen aus dem Konzept zu welchem Befund geführt haben – oder welche Testideen gar kein Ergebnis produziert haben.

Ein Testbericht sollte eine Rückverfolgbarkeit ("Traceability") zu den definierten Testfällen bieten.

### 2.3 Unbegründete Coverage-Angabe

In Abschnitt 6 ("Testabdeckung") wird behauptet, die Auditqualität liege bei "> 90 %". Diese Zahl ist vollständig unbelegt. Es gibt keine Metrik, keine Methode und keinen Benchmark, auf die sich diese Prozentzahl stützt. Solche Aussagen ohne Grundlage schwächen die Glaubwürdigkeit des gesamten Berichts.

---

## 3. Inhaltliche Schwächen

### 3.1 T-02 ist kein eigentliches Finding

T-02 ("Lokale `.env` mit sensitiven Werten") räumt selbst ein: "Kein bestätigter Secret-Leak über das Repository." Das bedeutet, es wurde kein Sicherheitsproblem nachgewiesen, sondern eine potenzielle Gefahr beschrieben. Ein Finding setzt einen nachgewiesenen Befund voraus, nicht eine Möglichkeit. T-02 gehört in einen Hinweisabschnitt, nicht in die offizielle Finding-Liste – und verfälscht damit die Zählung (12 Findings statt 11).

### 3.2 T-01 und T-11 sind redundant

T-11 ("Dauerhaft gemountete Testfunktionen im Master-Router") beschreibt dasselbe Problem wie T-01 (offene Test-Route), nur aus einer anderen Perspektive. Die Empfehlung in T-11 (`if (process.env.ENVIRONMENT === 'dev') app.use('/test', testRoutes)`) ist eine Teilmassnahme des in T-01 genannten Problems. Zwei separate Findings für dieselbe Schwachstelle aufzuführen, bläht den Bericht künstlich auf.

### 3.3 Schweregradbewertung teilweise inkonsistent

- T-03 (Session-Cookie ohne Secure-Flag) wird als **Hoch** bewertet. Das Flag fehlt explizit nur für lokales Testing (`// disabled for local HTTP testing`) – das Risiko in Produktion ist real, aber der Code zeigt, dass das bewusst so gesetzt wurde. Die Einstufung als "Hoch" ohne Kontext, ob Produktion überhaupt über HTTP läuft, ist fragwürdig.
- T-04 (Auth-Sync Spoofing) ist ebenfalls **Hoch**, erlaubt aber aktive Identitätsmanipulation und Datenkorruption – eine Stufe, die näher an **Kritisch** liegt als T-03.

Die fehlende Verwendung eines standardisierten Scoring-Systems (z. B. CVSS) macht subjektive Einschätzungen nicht nachvollziehbar und vergleichbar.

### 3.4 T-06: Firebase-Schutzmechanismen ignoriert

T-06 bezeichnet den Brute-Force-Schutz als "Attrappe". Firebase (`signInWithEmailAndPassword`) hat jedoch eigene serverseitige Rate-Limiting- und Account-Lockout-Mechanismen. Der Bericht erwähnt diese mit dem Klammerzusatz "(respektive werden nur durch Firebase blockiert, nicht durch Backend-Einschränkungen)" – behandelt diesen Schutz aber als irrelevant, ohne zu begründen, warum der Firebase-Schutz als unzureichend gilt. Das ist eine unvollständige Risikoanalyse.

### 3.5 T-08: Empfehlung technisch unklar

Die Empfehlung zu MFA schlägt vor, den Firebase-Custom-Claim `amr` (Authentication Methods Reference) serverseitig zu prüfen. Dieser Claim ist in Firebase **kein standardmässig gesetzter Custom Claim** – er müsste explizit via Firebase Admin SDK nach MFA-Verifikation gesetzt werden. Die Empfehlung setzt Infrastruktur voraus, die vermutlich nicht existiert, und erklärt nicht, wie diese aufgebaut werden soll.

---

## 4. Formale Schwächen

### 4.1 Inkonsistente Umlaut-Behandlung

Das Testkonzept vermeidet Umlaute konsequent (ä → ae, ö → oe, etc.), der Testbericht verwendet Umlaute direkt. Das ist ein kleiner aber sichtbarer Qualitätsmangel, der auf fehlende redaktionelle Abstimmung hindeutet.

## 5. Fazit

Die identifizierten Schwachstellen (insbesondere T-01, T-03, T-04) sind valide und gut belegt. Die Hauptprobleme liegen in der fehlenden dynamischen Verifikation, der künstlichen Aufblähung der Finding-Anzahl (T-02, T-11) und den teils unbegründeten Bewertungen. Ein standardisiertes Severity-Scoring (CVSS) und eine saubere Traceability zum Testkonzept würden die Qualität deutlich heben.
