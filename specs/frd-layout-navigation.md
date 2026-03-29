# FRD-001: Layout & Navigation

**Status:** Draft
**PRD Section:** 3.1.1
**Priority:** P0

## Overview

Site-wide layout providing consistent header navigation, footer, and responsive mobile menu across all public pages. All text content is in German (de-CH). The layout serves as the structural shell for the entire DJ Training website.

## User Stories

- As a visitor, I want to see a consistent navigation bar on every page so that I can easily find and access all sections of the website.
- As a visitor on mobile, I want a hamburger menu so that the navigation doesn't crowd my small screen.
- As a visitor, I want to see which page I'm currently on highlighted in the navigation so that I know where I am.
- As a visitor, I want a footer with contact info and legal links on every page so that I can always find important information.

## Acceptance Criteria

- [ ] Header is visible on all public pages
- [ ] Header contains the DJ Training logo/brand name linking to homepage
- [ ] Navigation contains links: Home, Über mich, Angebot, Trainingszeiten, Kundenstimmen, Kontakt
- [ ] "Angebot" has sub-navigation links: Personal Training, Gruppentraining, Ernährungscoaching
- [ ] Active page is visually highlighted in the navigation (distinct color or underline)
- [ ] On mobile (< 768px), navigation collapses into a hamburger menu icon
- [ ] Hamburger menu opens a slide-out or dropdown menu with all navigation links
- [ ] Hamburger menu can be closed by tapping the icon again or tapping outside
- [ ] Footer is visible on all public pages
- [ ] Footer displays business name: "DJ's Training-Fitness Studio Juratovic"
- [ ] Footer displays address: Rösslimattstrasse 2c, CH-5033 Buchs AG
- [ ] Footer displays phone: +41 78 611 24 79 (clickable tel: link)
- [ ] Footer displays email: info@dj-training.com (clickable mailto: link)
- [ ] Footer contains links to: Impressum (/impressum), AGB (/agb), Datenschutz (/datenschutz)
- [ ] Footer displays copyright: "© DJ's Training"
- [ ] HTML lang attribute is set to "de"
- [ ] All navigation text is in German

## UI/UX Requirements

### Header
- Fixed or sticky header at the top of the page
- Left: Logo/brand name "DJ's Training"
- Right: Horizontal navigation links (desktop)
- Height: ~64px desktop, ~56px mobile
- Background: solid color or semi-transparent with backdrop blur

### Navigation Links (Desktop)
- Horizontal row of links with hover effects
- "Angebot" shows a dropdown on hover with sub-links:
  - Personal Training → /personal-training
  - Gruppentraining → /gruppentraining
  - Ernährungscoaching → /ernaehrungscoaching
- Active link has a visual indicator (underline, bold, or accent color)

### Navigation Links (Mobile)
- Hamburger icon (☰) replaces horizontal links below 768px
- Menu slides in from the right or drops down
- All links listed vertically including Angebot sub-links
- Close button (✕) or tap-outside to dismiss
- Smooth open/close animation

### Footer
- Full-width footer with dark background
- Three sections (responsive grid):
  1. Business info (name, address)
  2. Contact info (phone, email)
  3. Legal links (Impressum, AGB, Datenschutz)
- Copyright line at the bottom
- Padding: comfortable spacing on all devices

### Responsive Breakpoints
- Mobile: < 768px — hamburger menu, stacked footer
- Tablet: 768–1024px — horizontal nav, 2-column footer
- Desktop: > 1024px — full horizontal nav, 3-column footer

## API Requirements

No API endpoints required for layout and navigation. All content is static.

## Content

### Navigation Labels (German)
| Link | Label | Route |
|------|-------|-------|
| Home | Home | / |
| About | Über mich | /ueber-mich |
| Services | Angebot | /angebot |
| — Personal Training | Personal Training | /personal-training |
| — Group Training | Gruppentraining | /gruppentraining |
| — Nutrition | Ernährungscoaching | /ernaehrungscoaching |
| Schedule | Trainingszeiten | /trainingszeiten |
| Testimonials | Kundenstimmen | /kundenstimmen |
| Contact | Kontakt | /kontakt |

### Footer Content (German)
```
DJ's Training-Fitness Studio Juratovic
Rösslimattstrasse 2c
CH-5033 Buchs AG

Tel: +41 78 611 24 79
E-Mail: info@dj-training.com

Impressum | AGB | Datenschutz

© DJ's Training
```

## Edge Cases

- **No JavaScript:** Navigation links should be accessible even if JS fails to load (progressive enhancement)
- **Very long page titles:** Navigation should not break layout with long text
- **Deep linking:** Active state must work correctly when navigating directly to a sub-page via URL
- **Keyboard navigation:** All nav links must be reachable via Tab key; hamburger menu must be operable via keyboard
- **Screen readers:** Navigation should use `<nav>` landmark, menu state announced via aria-expanded
- **Scroll behavior:** Header should remain accessible during long page scrolls (sticky or scroll-to-top button)
