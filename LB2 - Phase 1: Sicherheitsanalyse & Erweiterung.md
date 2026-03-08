# LB2 - Phase 1: Sicherheitsanalyse & Erweiterung

## Erweiterung der Applikation

Wir haben uns für eine moderne Identitätslösung entschieden, um die Schutzziele **Vertraulichkeit** und **Integrität** massiv zu stärken.

### 1: User Registrierung via Firebase

- **Umsetzung:** Integration von **Firebase Authentication**. Benutzer können sich nun über ein sicheres Interface registrieren.
- **Sicherheitsaspekt:** Wir speichern keine Passwörter mehr in unserer lokalen SQL-Datenbank. Firebase übernimmt das sichere Hashing und Management der Anmeldedaten nach Industriestandards (ISO 27001, SOC 2).

### 2: Multi-Faktor-Authentifizierung (MFA)

- **Umsetzung:** Nutzung der Firebase MFA-Funktionalität. Nach Eingabe von E-Mail und Passwort muss der Benutzer einen **zweiten Faktor** (E-Mail-Verifizierungscode oder TOTP) bestätigen.
- **Sicherheitsaspekt:** Selbst wenn das Passwort kompromittiert wird, bleibt der Zugriff auf die To-Do-Liste verweigert, solange der Angreifer keinen Zugriff auf das physische Gerät oder das E-Mail-Konto des Benutzers hat.

### 3. Technische Details der Implementierung

- **Authentifizierung:** Der Client erhält nach dem Login ein **JWT (JSON Web Token)** von Firebase.
- **Autorisierung:** Unsere Node.js-Backend-Middleware verifiziert dieses Token bei jedem Request mittels des `firebase-admin` SDKs. Erst nach erfolgreicher Validierung werden Daten aus der lokalen Datenbank freigegeben.
- **Daten-Mapping:** In unserer SQL-Datenbank wird lediglich die Firebase `uid` als Fremdschlüssel für die Tasks gespeichert.
