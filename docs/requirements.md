# Diary — Product Requirements

A private, mobile-first journal. One page per day, like a paper diary. Beautiful to open every day, calm to write in, easy to look back through a calendar.

This document is the **full product vision**. It is the source of truth for what the product is, how it feels, and what it must do.

---

## 1. Product vision

People already have notes apps. They do not have a place that feels like *their* diary: a dated page, a month that looks like the season, a birthday that feels special, and nothing shared with anyone else.

**One-line pitch:** A private daily diary on your phone — one page per day, themed to your life, never for anyone else.

### Principles

1. **Private by default.** Entries never leave the user’s account. No sharing, public links, or social features.
2. **One page per day.** Reopening today continues the same page. The date *is* the identity of the entry.
3. **Mobile first.** Designed for a phone screen. Desktop is a stretched, comfortable version of the same app, not a separate product.
4. **Calm writing.** Fast to open, obvious where to type, no clutter while writing.
5. **Personal, not noisy.** Themes and greetings should feel like a small gift, not a notification feed.
6. **The calendar is the bookshelf.** Browsing history should feel visual and spatial, not like a file list.

---

## 2. Who it is for

**Primary user:** An individual who wants a private place to write thoughts, feelings, and the day — and to come back to those pages later.

They care about:

- Opening the app and writing in under a few seconds
- Seeing *which days they wrote* at a glance
- The diary feeling personal (month, holidays, birthday, a theme they love)
- Trust that nobody else can read it

**Not for:** teams, public blogs, shared family journals, or social “memory feeds.”

---

## 3. Experience goals

A good day with the product looks like this:

1. User opens the installed app on their phone.
2. They land on **today’s page**, already themed for the month (or a holiday / their birthday / their locked theme).
3. They write. Mood is optional. Formatting is available but not in the way.
4. They save without thinking about it (autosave).
5. Later they open the **calendar**, tap a day with writing, and read that page.
6. They can search old pages when they remember a word, not a date.

---

## 4. Product shape (mobile-first PWA)

The app is a **Progressive Web App**:

- Installable on the home screen (Add to Home Screen / install prompt)
- App-like shell: no browser chrome once installed, if the OS allows it
- Mobile viewport is the design target (portrait phone)
- **Online required** to read and write. Offline writing is out of this vision unless we later decide to add sync.

Desktop and tablet should work, but layouts, tap targets, bottom navigation, and calendar gestures are designed for phone first.

### Primary screens

| Screen | Purpose |
| --- | --- |
| Today | Write / continue today’s page |
| Calendar | Browse months, see written days, jump to a page |
| Search | Find pages by text, mood, or date range |
| Page | Read one day’s page; edit if allowed |
| Profile | Name, birthday, theme preference, account |
| Sign in / Register | Email + password or Google |

There are **no** separate pages for filter, sort, export, or delete as destinations. Those are actions on Calendar, Search, Page, or Profile.

### Navigation (phone)

Persistent bottom nav (signed-in):

1. **Today**
2. **Calendar**
3. **Search**
4. **Me** (profile & settings)

Auth screens have no bottom nav.

---

## 5. Accounts and identity

Users must have an account. Diaries are per account. There is no guest writing.

### Sign up / sign in

- **Email + password**
- **Google**
- Same account can be linked over time if we support connecting Google to an existing email account (see open questions)
- Standard flows: register, login, logout, forgot password / reset
- Session persists across visits on that device (stay signed in)

### Profile (required for personalization)

| Field | Required | Why |
| --- | --- | --- |
| Display name | Yes | Greetings, empty states (“Good evening, Maya”) |
| Email | Yes (from auth) | Account |
| Birthday | Strongly encouraged | Birthday theme and greeting |
| Timezone | Auto from device, editable | “Today” and calendar midnight |
| Preferred theme mode | Optional | Auto vs locked favorite |

Birthday can be month + day only (year optional) so users need not share age.

### Account rules

- One diary per user (not multiple books)
- User can change password, linked Google, display name, birthday, timezone
- User can delete their account, which permanently deletes all pages

---

## 6. The diary page (core model)

### One page per day

- Exactly **one page per calendar date** per user
- Date is in the user’s timezone
- Opening Today always opens *today’s* page
- If they have not written yet, the page is empty but already “exists” as today — they just start typing
- Writing on a past date is allowed (backfill). Writing on a future date is **not** allowed

### Page content

| Field | Notes |
| --- | --- |
| Date | Immutable key |
| Body | Rich text (headings, bold, italic, lists). Also usable as simple plain writing if the user never touches formatting |
| Mood | Optional. A small set of moods, not a clinical tracker |
| Created / updated | Timestamps |
| Word count | Derived, for display if useful |

**Not in this product (unless later reopened):** photos, voice notes, weather, location, tags as a primary system.

Mood is a first-class, lightweight signal — useful on the calendar (dot or icon) and in search filters.

### Writing experience

- Today opens with keyboard-friendly layout: date + theme atmosphere at top, writing area filling the screen
- **Autosave** while typing (with a quiet “Saved” state)
- Manual save is not required; a back/nav away must not lose text
- Formatting toolbar is compact and hideable so the page still feels like a diary, not a document editor
- Empty today: a gentle prompt, not a blank CMS
- Past pages: read by default, with an obvious **Edit** control
- While editing a past page, same editor as today

### Edit and delete

- User can edit any of their pages
- User can **clear** a page (empty body + no mood) or **delete** the page record
- Delete is confirm-only (destructive). Clearing vs deleting: delete removes the “written” mark from the calendar; a cleared empty page should also not look like a written day

---

## 7. Calendar

The calendar is the main way to browse the diary.

### Views

- **Month view** (default, primary): a beautiful monthly grid
- **Year view**: 12 mini-months to jump quickly
- Swipe or chevrons between months
- Today is visually distinct
- Days with writing are visually distinct from empty days (fill, dot, or mood mark)
- Days without writing are tappable and open an empty page for **past** dates only; future dates are disabled
- Birthday (if set) is marked on the calendar every year
- Holidays that apply to the user are marked (subtle; birthday and written days stay more important)

### Interaction

- Tap a day → that day’s page
- Long-press or a small overflow is not required in v1 of the vision; tap is enough
- Month title and theme of the **displayed month** should match that month’s look, even if the user’s locked theme overrides the chrome (see Themes)

### Calendar beauty

The calendar is not a scheduling widget. It should feel like the cover and index of a diary:

- Typography and color follow the active theme
- Written days should make a satisfying “constellation” over the month
- Mood can tint or icon the day without turning the grid into a chart

---

## 8. Browse, search, filter, sort

### Browse

- From Calendar (spatial)
- From a page, previous / next **written** day (skip empty dates), plus jump to calendar

### Search

- Full-text search over page body
- Results show date, snippet, mood
- Tap opens that page

### Filter and sort (on Search, not separate apps)

Filter:

- Date range
- Mood
- Written vs empty is irrelevant in search (search only returns pages with content)

Sort:

- Newest first (default)
- Oldest first

---

## 9. Themes and personalization

Themes are how the product feels *theirs*. They change color, atmosphere, illustration/texture, and small copy — not the information architecture.

### Theme sources (priority)

When several apply, use this order (highest first):

1. **User-locked theme** — if the user pinned a favorite, that theme wins everywhere
2. **Birthday** — on the user’s birthday (timezone), a special birthday theme and greeting
3. **Holiday** — on a recognized holiday the user has enabled
4. **Month theme** — default: each month has its own look (e.g. January winter-quiet, October autumn)

If the user has **not** locked a theme, the diary should quietly change through the year.

### Month themes

- 12 month themes, designed as a set (same diary, different season)
- Calendar month view uses that month’s theme for the month being viewed (or the locked theme, if pinned)
- Today’s writing screen uses the theme for *today’s* date (unless locked)

### Birthday

- Requires birthday on profile
- On that day: distinct theme, warm greeting using display name
- Optional small mark on the calendar every year
- Should feel intimate and brief, not like a marketing campaign

### Holidays

- A curated holiday set (product-defined), not every public holiday on earth
- User can enable/disable holiday themes, and which holiday calendar fits them (see open questions)
- On the day: theme + a short, tasteful greeting
- Holidays never override a locked theme or birthday

### User-picked theme

- Gallery of all month themes + birthday/holiday looks (or a subset that is allowed as “wearable” themes)
- User can **preview**, **apply once**, or **lock**
- Lock: “Always use this theme” until they unlock
- Unlock: return to automatic month / holiday / birthday

### Personalization copy

Use display name and context sparingly:

- Birthday: “Happy birthday, Maya.”
- Today empty state can be time-of-day aware (“Good evening”)
- Do not nag, do not gamify (“You haven’t written in 12 days!” is not this product)

---

## 10. Privacy and data

This is a **fully private** diary.

### Must

- A user can only read, write, edit, search, and delete **their own** pages
- No sharing with other users
- No public URLs for entries
- No feed, comments, likes, or followers
- Listings, search, and APIs must never leak another user’s content

### Account deletion

- Deletes profile, pages, and auth linkage
- Irreversible after confirm

### Backup (personal, not sharing)

Because there is no sharing, the user still needs a way to keep their writing:

- **Export** their diary (e.g. JSON and/or a readable format such as Markdown/PDF) for personal backup
- **Import** from a previous export of *this* product (restore / move devices)

Import is not a generic “upload anyone’s files” feature; it restores the user’s own backup into their account, with clear rules for date conflicts (see open questions).

---

## 11. PWA and “daily use” quality

### Install

- Web app manifest: name, icons, theme color, standalone display
- Installable on Android; iOS via Add to Home Screen (document the limitation)
- Splash / theme color should follow the active theme where the platform allows

### Performance and feel

- First tap to typing on Today should feel immediate after load
- Calendar month switch should be smooth
- Autosave must not hitch the keyboard
- Layouts use safe areas (notch, home indicator)
- Touch targets are thumb-friendly; bottom nav is reachable one-handed

### Network

- Online is required for read/write
- If offline or the API fails: a clear, calm message — do not pretend to save
- Retry when back online

### Notifications

- Not part of this product vision (no daily reminder spam)
- If added later, they must be opt-in and easy to silence

---

## 12. Functional requirements (checklist)

### Auth

- [ ] Register with email + password
- [ ] Sign in with email + password
- [ ] Sign in with Google
- [ ] Password reset
- [ ] Stay signed in on the device
- [ ] Sign out
- [ ] Delete account and all diary data

### Profile

- [ ] Set and edit display name
- [ ] Set and edit birthday (month/day; year optional)
- [ ] Timezone detected and editable
- [ ] Theme: automatic vs locked favorite
- [ ] Enable/disable holiday themes

### Pages

- [ ] Open today’s page
- [ ] Create content by writing (one page per date)
- [ ] Rich text body
- [ ] Optional mood
- [ ] Autosave
- [ ] Open a past date from calendar
- [ ] Edit a past page
- [ ] Delete or clear a page
- [ ] Cannot create a future page

### Calendar

- [ ] Month view with written-day states
- [ ] Year view to jump months
- [ ] Today highlighted
- [ ] Birthday and holiday marks
- [ ] Theme follows month (or lock / special day)

### Find

- [ ] Search by text
- [ ] Filter by mood and date range
- [ ] Sort newest / oldest
- [ ] Previous / next written page

### Personalization

- [ ] 12 month themes
- [ ] Birthday theme + greeting
- [ ] Holiday themes + greetings
- [ ] Theme gallery and lock

### PWA

- [ ] Installable
- [ ] Standalone display
- [ ] Icons and theme color

### Backup

- [ ] Export all pages
- [ ] Import from product export

---

## 13. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Privacy | Strict user isolation; private diary |
| Security | Authenticated APIs; passwords hashed; HTTPS |
| Reliability | Autosave must not silently drop text on success path |
| Accessibility | Readable type, contrast that still works in themed UIs, labels on icon buttons, keyboard on desktop |
| Localization | UI language TBD; dates follow user locale; “today” follows timezone |
| Support | Phone-first; modern mobile browsers (current Chrome, Safari, Firefox) |

---

## 14. Out of scope

Explicitly **not** this product:

- Sharing entries with other users
- Public or unlisted links
- Comments, likes, followers
- Multiple diaries / notebooks per user
- Photos, voice notes, location, weather
- Streaks, scores, guilt-based reminders
- Future-dated pages
- Offline writing and sync
- End-to-end encryption (nice later; not assumed here)
- Collaborative or family accounts
- Admin “read this user’s diary” except as a break-glass ops process that should be avoided by design

---

## 15. Assumptions

- Platform: web PWA (this repo is a Next.js app). Native iOS/Android stores are not required.
- One person, one account, one diary.
- “Today” is the user’s timezone date, not UTC date.
- Rich text is lightweight (not full Word/Google Docs).
- Moods are a small fixed set defined by the product.
- Holiday list is curated by us; users opt into a calendar that fits them.
- Export/import exists so a private diary can still be backed up and moved.

---

## 16. Open questions

These do not block the rest of the spec, but should be decided before build for those areas.

1. **Product name** — still “Diary” or a distinct name?
2. **Holiday set** — which calendars (e.g. international, India, user-picked list)?
3. **Mood set** — which moods, and how they appear on the calendar?
4. **Rich text limits** — headings, lists, quotes, links? Any markdown shortcut?
5. **Google + email** — can one person link both to the same account?
6. **Import conflicts** — if a date already has a page, skip / overwrite / merge?
7. **Export formats** — JSON for restore, plus Markdown or PDF for reading?
8. **Minimum age / birthday year** — do we store year at all?
9. **Empty past days** — tap opens a new page to backfill, or only written days are tappable?
10. **Locked theme vs calendar month** — when a theme is locked, does the calendar still hint at seasons, or is the whole app one look?

---

## 17. Success

The product is working if:

- Someone can install it, create an account, and write today’s page in the first session
- They can find last Tuesday from the calendar without search
- October looks like October, and their birthday looks like their birthday — unless they locked a theme they love
- They never see another person’s writing
- They are not asked to share, streak, or perform

That’s the diary.
