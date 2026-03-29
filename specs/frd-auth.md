# FRD-009: Authentication System

**Status:** Draft
**PRD Section:** 3.2
**Priority:** P2

## Overview

User authentication system enabling registration, login/logout, and profile management. The system uses email/password authentication with JWT tokens and session-based security. It integrates with the existing Express.js API backend and provides a Next.js frontend for all auth-related user flows.

## User Stories

- As a visitor, I want to create an account with my email and password so that I can access member features.
- As a registered user, I want to log in with my credentials so that I can access my profile.
- As a logged-in user, I want to log out so that my session is securely ended.
- As a logged-in user, I want to view and edit my profile so that I can keep my information up to date.
- As a logged-in user, I want to change my password so that I can maintain account security.
- As a visitor, I want to see clear error messages if login fails so that I know what went wrong.

## Acceptance Criteria

### Registration
- [ ] Registration page is accessible at /registrieren
- [ ] Registration form has fields: Name, E-Mail, Passwort, Passwort bestätigen
- [ ] Name field is required
- [ ] Email field is required and validates email format
- [ ] Email must be unique — duplicate emails rejected with clear error message
- [ ] Password field is required with minimum 8 characters
- [ ] Password confirmation must match password
- [ ] Passwords are stored hashed using bcrypt
- [ ] Successful registration redirects to login page with confirmation message
- [ ] Registration form displays inline validation errors in German

### Login
- [ ] Login page is accessible at /login
- [ ] Login form has fields: E-Mail, Passwort
- [ ] Invalid credentials show a generic error message (no information leakage)
- [ ] Successful login redirects to homepage (or previous protected page)
- [ ] JWT token is issued upon successful login
- [ ] Token is stored securely (httpOnly cookie)
- [ ] Login page has a link to registration: "Noch kein Konto? Jetzt registrieren"

### Logout
- [ ] Logout option is visible in the navigation when user is logged in
- [ ] Logout clears the JWT token/session
- [ ] Logout redirects to the homepage
- [ ] After logout, protected pages redirect to login

### Profile Management
- [ ] Profile page is accessible at /profil (authenticated users only)
- [ ] Profile page displays user's name and email
- [ ] Users can update their name
- [ ] Users can change their password (requires current password + new password + confirmation)
- [ ] Profile changes display a success confirmation message
- [ ] Unauthenticated users accessing /profil are redirected to /login

### Navigation Integration
- [ ] When logged out: navigation shows "Anmelden" link to /login
- [ ] When logged in: navigation shows user name and dropdown with "Profil" and "Abmelden"
- [ ] Admin users see additional "Admin" link in navigation

## UI/UX Requirements

### Registration Page (/registrieren)
- Centered form card (max-width 480px)
- Heading: "Konto erstellen"
- Fields stacked vertically with labels
- Submit button: "Registrieren"
- Link below: "Bereits ein Konto? Anmelden →"
- Inline validation errors below each field

### Login Page (/login)
- Centered form card (max-width 480px)
- Heading: "Anmelden"
- Fields: E-Mail, Passwort
- Submit button: "Anmelden"
- Link below: "Noch kein Konto? Jetzt registrieren →"
- Error alert for failed login attempts

### Profile Page (/profil)
- Page heading: "Mein Profil"
- Two sections:
  1. Personal info (Name, Email) with "Speichern" button
  2. Password change (Current, New, Confirm) with "Passwort ändern" button
- Success/error messages displayed inline

### Auth State in Navigation
- Logged out: "Anmelden" text link or button
- Logged in: User name with dropdown menu:
  - "Mein Profil" → /profil
  - "Admin" → /admin (if admin role)
  - "Abmelden" → logout action

## API Requirements

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Response (201 Created):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": { "email": "E-Mail-Adresse wird bereits verwendet." }
}
```

### POST /api/auth/login
Authenticate a user and issue JWT.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "user|admin"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Ungültige Anmeldedaten."
}
```

### POST /api/auth/logout
Invalidate the current session.

**Response (200 OK):**
```json
{
  "message": "Erfolgreich abgemeldet."
}
```

### GET /api/auth/me
Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user|admin"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Nicht authentifiziert."
}
```

### PUT /api/auth/profile
Update the current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user|admin"
}
```

### PUT /api/auth/password
Change the current user's password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Response (200 OK):**
```json
{
  "message": "Passwort erfolgreich geändert."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Das aktuelle Passwort ist nicht korrekt."
}
```

## Content

### Registration Page (German)
```
Heading: Konto erstellen
Fields:
  - Name: "Name" (placeholder: "Dein vollständiger Name")
  - E-Mail: "E-Mail" (placeholder: "name@beispiel.ch")
  - Passwort: "Passwort" (placeholder: "Mindestens 8 Zeichen")
  - Passwort bestätigen: "Passwort bestätigen"
Button: "Registrieren"
Link: "Bereits ein Konto? Anmelden"
Success: "Konto erfolgreich erstellt! Du kannst dich jetzt anmelden."
```

### Login Page (German)
```
Heading: Anmelden
Fields:
  - E-Mail: "E-Mail" (placeholder: "name@beispiel.ch")
  - Passwort: "Passwort"
Button: "Anmelden"
Link: "Noch kein Konto? Jetzt registrieren"
Error: "Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort."
```

### Profile Page (German)
```
Heading: Mein Profil

Section 1: Persönliche Daten
  - Name: "Name"
  - E-Mail: "E-Mail" (read-only)
  Button: "Speichern"
  Success: "Profil erfolgreich aktualisiert."

Section 2: Passwort ändern
  - Aktuelles Passwort: "Aktuelles Passwort"
  - Neues Passwort: "Neues Passwort" (placeholder: "Mindestens 8 Zeichen")
  - Passwort bestätigen: "Neues Passwort bestätigen"
  Button: "Passwort ändern"
  Success: "Passwort erfolgreich geändert."
  Error: "Das aktuelle Passwort ist nicht korrekt."
```

### Validation Messages (German)
```
Name required: "Bitte gib deinen Namen ein."
Email required: "Bitte gib deine E-Mail-Adresse ein."
Email invalid: "Bitte gib eine gültige E-Mail-Adresse ein."
Email taken: "Diese E-Mail-Adresse wird bereits verwendet."
Password required: "Bitte gib ein Passwort ein."
Password too short: "Das Passwort muss mindestens 8 Zeichen lang sein."
Password mismatch: "Die Passwörter stimmen nicht überein."
```

### SEO Meta Tags (German)
```html
<!-- /login -->
<title>Anmelden — DJ's Training</title>
<meta name="robots" content="noindex, follow" />

<!-- /registrieren -->
<title>Registrieren — DJ's Training</title>
<meta name="robots" content="noindex, follow" />

<!-- /profil -->
<title>Mein Profil — DJ's Training</title>
<meta name="robots" content="noindex, nofollow" />
```

## Edge Cases

- **Duplicate email:** Clear error message without revealing if the email exists (security consideration)
- **Weak password:** Enforce minimum 8 characters; consider strength indicator
- **Session expiry:** Token expires after configurable duration; redirect to login with message
- **Concurrent sessions:** User can be logged in on multiple devices
- **Password reset:** Out of scope for initial release (future enhancement)
- **Account lockout:** After 5 failed login attempts, temporarily lock account or add CAPTCHA
- **CSRF protection:** All form submissions protected against CSRF
- **XSS prevention:** All user input sanitized before storage and display
- **Token refresh:** Consider refresh token mechanism for long-lived sessions
- **OAuth/social login:** Out of scope (future enhancement)
- **Email verification:** Out of scope for initial release
- **No JavaScript:** Auth forms require JavaScript for client-side validation; server-side validation always runs
