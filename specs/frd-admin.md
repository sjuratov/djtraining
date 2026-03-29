# FRD-010: Admin Dashboard

**Status:** Draft
**PRD Section:** 3.3
**Priority:** P2

## Overview

Admin dashboard for managing registered users. Only accessible to users with the admin role. Provides a user list with details, role management, and account actions. Diana (the business owner) is the primary admin user.

## User Stories

- As an admin, I want to view a list of all registered users so that I can see who has an account.
- As an admin, I want to see user details (name, email, role, registration date) so that I can manage accounts.
- As an admin, I want to change a user's role so that I can promote or demote users.
- As an admin, I want to deactivate a user account so that I can manage access.
- As a non-admin user, I want to be prevented from accessing the admin area so that user data is protected.

## Acceptance Criteria

### Access Control
- [ ] Admin dashboard is accessible at /admin
- [ ] Only users with role "admin" can access /admin
- [ ] Non-admin users accessing /admin are redirected to homepage with an error message
- [ ] Unauthenticated users accessing /admin are redirected to /login
- [ ] Admin link is only visible in navigation for admin users

### User List
- [ ] Dashboard displays a table of all registered users
- [ ] Table columns: Name, E-Mail, Rolle (Role), Registriert am (Date), Status
- [ ] User list supports pagination (if > 20 users)
- [ ] User list is sortable by name, email, or registration date
- [ ] User list displays total user count

### User Management Actions
- [ ] Admin can view full details of a user
- [ ] Admin can change a user's role between "user" and "admin"
- [ ] Admin can deactivate a user account
- [ ] Admin can reactivate a deactivated user account
- [ ] Role changes and deactivations require confirmation dialog
- [ ] Admin cannot deactivate their own account
- [ ] Admin cannot remove their own admin role

## UI/UX Requirements

### Dashboard Layout
- Page heading: "Admin Dashboard"
- Summary stats at the top: total users, active users, admin count
- User table below stats
- Responsive: table scrolls horizontally on mobile

### User Table
- Clean data table with alternating row colors
- Columns: Name, E-Mail, Rolle, Registriert am, Status, Aktionen
- "Rolle" displayed as badge: "Admin" (accent color) or "Benutzer" (neutral)
- "Status" displayed as badge: "Aktiv" (green) or "Deaktiviert" (red)
- "Aktionen" column with icon buttons or dropdown menu

### Action Buttons
- View details: eye icon or "Details" link
- Change role: toggle or dropdown (Benutzer ↔ Admin)
- Deactivate/Reactivate: toggle button with color change
- All destructive actions show a confirmation modal

### Confirmation Modal
- "Bist du sicher?" heading
- Description of the action
- "Abbrechen" (Cancel) and "Bestätigen" (Confirm) buttons
- Destructive actions use red button color

### User Detail View (Optional)
- Slide-out panel or separate page
- Shows all user info: name, email, role, registration date, last login
- Action buttons for role change and deactivation

### Responsive Behavior
- Desktop: full table with all columns
- Tablet: table with horizontal scroll
- Mobile: card layout with key info and expandable details

## API Requirements

### GET /api/admin/users
List all registered users. Admin only.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `sort` (string: "name" | "email" | "createdAt", default: "createdAt")
- `order` (string: "asc" | "desc", default: "desc")

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "user|admin",
      "status": "active|deactivated",
      "createdAt": "ISO8601 date string"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Zugriff verweigert. Nur Administratoren haben Zugriff."
}
```

### PUT /api/admin/users/:id/role
Change a user's role. Admin only.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "user|admin"
}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "admin",
  "message": "Rolle erfolgreich geändert."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Du kannst deine eigene Rolle nicht ändern."
}
```

### PUT /api/admin/users/:id/status
Activate or deactivate a user. Admin only.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "active|deactivated"
}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "status": "deactivated",
  "message": "Benutzerstatus erfolgreich geändert."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Du kannst deinen eigenen Account nicht deaktivieren."
}
```

## Content

### Dashboard Page (German)
```
Heading: Admin Dashboard

Stats:
- Registrierte Benutzer: {total}
- Aktive Benutzer: {active_count}
- Administratoren: {admin_count}
```

### User Table Headers (German)
```
| Name | E-Mail | Rolle | Registriert am | Status | Aktionen |
```

### Role Labels (German)
```
admin → "Admin"
user → "Benutzer"
```

### Status Labels (German)
```
active → "Aktiv"
deactivated → "Deaktiviert"
```

### Action Labels (German)
```
View: "Details anzeigen"
Change role to admin: "Zum Admin machen"
Change role to user: "Zum Benutzer machen"
Deactivate: "Deaktivieren"
Reactivate: "Aktivieren"
```

### Confirmation Dialog (German)
```
Rolle ändern:
  Heading: "Rolle ändern"
  Text: "Möchtest du die Rolle von {name} zu {new_role} ändern?"
  Cancel: "Abbrechen"
  Confirm: "Bestätigen"

Deaktivieren:
  Heading: "Benutzer deaktivieren"
  Text: "Möchtest du den Account von {name} wirklich deaktivieren?"
  Cancel: "Abbrechen"
  Confirm: "Deaktivieren"

Aktivieren:
  Heading: "Benutzer aktivieren"
  Text: "Möchtest du den Account von {name} wieder aktivieren?"
  Cancel: "Abbrechen"
  Confirm: "Aktivieren"
```

### Success/Error Messages (German)
```
Role changed: "Rolle von {name} erfolgreich zu {role} geändert."
User deactivated: "Account von {name} wurde deaktiviert."
User reactivated: "Account von {name} wurde aktiviert."
Self-role error: "Du kannst deine eigene Rolle nicht ändern."
Self-deactivate error: "Du kannst deinen eigenen Account nicht deaktivieren."
Access denied: "Zugriff verweigert. Nur Administratoren haben Zugriff auf diesen Bereich."
```

### SEO Meta Tags
```html
<title>Admin Dashboard — DJ's Training</title>
<meta name="robots" content="noindex, nofollow" />
```

## Edge Cases

- **No users registered:** Show empty state: "Noch keine Benutzer registriert."
- **Single admin:** Prevent the last admin from removing their own admin role
- **Deactivated user login:** Deactivated users should see "Dein Account wurde deaktiviert" on login attempt
- **Concurrent admin actions:** Two admins modifying the same user simultaneously — use optimistic locking or last-write-wins
- **Pagination boundary:** Handle empty pages gracefully (redirect to last valid page)
- **Large user list:** Ensure table performance with many users (consider virtual scrolling for 1000+ users)
- **Self-modification protection:** Admin cannot change their own role or deactivate themselves (API + UI enforcement)
- **Role escalation prevention:** Only existing admins can create new admins
- **Search/filter:** Initially not required, but table structure should support future search feature
- **Session invalidation:** When an admin deactivates a user, that user's active sessions should be invalidated
- **No JavaScript:** Admin features require JavaScript; show appropriate message if disabled
