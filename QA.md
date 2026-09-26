# Diary — manual QA

Phases 0 through 9 are implemented; Phase 10 automation is in place and final illustrated artwork is deferred. This is the list of checks that still need a person, a browser, or the real services. Automated gates are at the bottom.

Nothing here needs a new environment variable. Use the existing `.env.local`.

## Before you click around

1. Confirm `.env.local` matches `.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
2. `BETTER_AUTH_URL` must be the origin you open in the browser, with no trailing slash. For local work that is `http://localhost:3000`.
3. In Google Cloud, the authorised redirect URI must be `{BETTER_AUTH_URL}/api/auth/callback/google`.
4. In Resend, `EMAIL_FROM` must be a sender the account is allowed to use.
5. Apply the database migration if this database has not had it yet: `pnpm db:migrate`.
6. Start the app with `pnpm dev` for the writing and account checks. Install and offline checks need a production server: `pnpm build && pnpm start`.

## Accounts

- [ ] Register with email, password, display name, birthday, and a detected timezone. Land on Today, greeted by that name.
- [ ] Sign out from Me, then sign back in with the same email. The session should still be there after a browser restart.
- [ ] Forgot password sends a real email. The link opens a reset page, and the new password signs in.
- [ ] Google sign-in creates an account and a profile. Signing in again with Google returns to the same diary.
- [ ] From Me → Account, link Google onto an email account that uses the same address. Both ways in should open one diary.
- [ ] Change password. The current password is required. Other sessions should be signed out.
- [ ] A Google-only account can request a password email from Me → Account.
- [ ] Wrong password, a short password, and a bad reset link show a calm message rather than a stack trace.

## Today

- [ ] Today opens on the current date in the profile timezone, with that day's greeting.
- [ ] Typing saves on its own after a short pause. The status goes to Saving, then Saved, then fades. A hard refresh still has the text.
- [ ] Opening Today without typing does not create a page. The calendar stays empty for that day.
- [ ] Bold, italic, heading, lists, and quote work from the Format row, and also from `# `, `- `, `1. `, and `> ` at the start of a line.
- [ ] The Format row can be hidden. The page still reads as a diary.
- [ ] A mood can be set, changed, and cleared by tapping it again. It is optional.
- [ ] Turn the network off mid-sentence. The status should say it is not saved, and it should not say Saved. Turn the network back on and Retry, or wait for it to retry. Then refresh and confirm the text is there.
- [ ] Switch away from the browser (or the phone) while a sentence is unsaved. Come back and confirm it was saved.
- [ ] Clear empties the words and the mood, and the day no longer looks written on the calendar. Delete removes the page. Both ask first.
- [ ] A future date cannot be saved. The calendar does not open one for writing.

## Calendar and past days

- [ ] The month you are looking at is themed as that month, unless a theme is locked or worn for this visit.
- [ ] Chevrons and a horizontal swipe move between months. A vertical scroll does not change the month.
- [ ] Today is marked. Written days are filled and have a dot. The mood is in the day's label for a screen reader.
- [ ] Your birthday is marked. An enabled holiday is marked, more quietly than a written day.
- [ ] An empty past day opens a blank page and can be written. A future day cannot be opened.
- [ ] Year view jumps to a month. Written days show as dots. With nothing locked, each mini-month hints at its own season.
- [ ] On a past page, the text is for reading until you tap Edit. Previous and Next skip empty days and land on written ones.
- [ ] Open the same page on two browsers and save both. The second save should say the page changed elsewhere, and Reload should bring in the other version instead of silently overwriting it.
- [ ] From the read-first past-day screen, try Clear or Delete after changing the same page elsewhere. The page must remain visible and offer Reload rather than pretending the stale action succeeded.

## Profile, themes, search

- [ ] Me can change the name, birthday, timezone, and holiday calendars. The greeting and "today" follow the new timezone after a refresh.
- [ ] Birthday year can be left blank. February 29 is allowed.
- [ ] International, India, both, or neither. A holiday theme shows on that day only when its calendar is on, and it does not override a birthday.
- [ ] Themes: Preview does not change the rest of the app. Wear for this visit changes the whole app until you return to the year or close the browser. Always use this keeps that look on Today, the calendar, and past days until you unlock it.
- [ ] Search finds a word from a page, shows the date and a short snippet, and opens that page. Mood, a date range, and newest or oldest change the list. An empty search does not dump every page.
- [ ] Search never shows another account's writing. Worth a second account if you have one.

## Backup and deletion

- [ ] Export JSON downloads a file. Export Markdown downloads a zip with one file per written day.
- [ ] Import that JSON on the same account. The preview counts pages and collisions. With overwrite off, existing days stay. With overwrite on, those days are replaced. Future dates in the file are skipped.
- [ ] A random JSON file is refused.
- [ ] Delete account asks you to type `delete my diary`. After it confirms, you are signed out, and that email can register again as a new empty diary. The old pages are gone.

## Install and offline

Run `pnpm build && pnpm start` and open the production URL over localhost, or the deployed HTTPS URL.

- [ ] Chrome on Android offers install, or the browser menu can install it. The icon is the Diary mark. It opens without browser chrome.
- [ ] On iPhone there is no install prompt. Share → Add to Home Screen works. Me explains that.
- [ ] Airplane mode on an installed app shows "You are offline" and does not pretend a page was saved.
- [ ] The status bar colour follows the active theme, light and dark.

## Look and access

- [ ] Light and dark follow the system setting. Check one winter month, one summer month, birthday, and one holiday in both.
- [ ] Type is readable, buttons are easy to hit with a thumb, and the bottom nav stays above the home indicator.
- [ ] Keyboard: you can tab to the nav, the calendar days, Format, and the dialogs. Focus is visible. Icon buttons have names.
- [ ] Desktop is the same app in a comfortable column, not a different product.

## Artwork

Illustrated backgrounds are not in the repo. Each theme still paints a gradient, grain, and vignette from its colours. When art exists, put it here and reload — no code change:

```
public/themes/<theme-id>/bg-light.avif
public/themes/<theme-id>/bg-dark.avif
```

Optional WebP copies with the same names are the fallback. Theme ids match the registry (`october`, `diwali`, `birthday`, and the rest).

## Already checked without a browser

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (36 tests: themes, dates, editor document, backup format, search snippets, rate limit, service-worker cache policy)
- `pnpm db:verify` (one page per day, bare date column, search index, mood and profile-theme checks, cascade delete)
- `pnpm audit:isolation` (structural guard: session-derived ownership and server-only boundaries)
- `pnpm audit:behavioral` (two-user reads, search, stale writes, import ownership, future dates, and cascade behavior in PGlite)
- `pnpm check:contrast` (every theme in both system schemes)
- `pnpm build`
- `pnpm check:budgets` (editor-route chunks and final-art file sizes)

Auth email, Google, a real phone install, and two-device conflict were not exercised here.
