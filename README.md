# Engrity Resume Flow

Internal AI-powered platform to automate creating, formatting, and managing candidate resumes into
the standardized Engrity template — a full app: chat-based intake, a candidate database, a drag-and-drop
builder, and account system, not a bare CRUD screen.

## Stack

- Next.js 14 (App Router) + Tailwind CSS
- Zustand for state management (auth session, resume builder draft, chat history — persisted across refresh)
- Supabase (Postgres + pgvector, Auth with email/password + OTP code verification, Storage)
- `@dnd-kit` for drag-and-drop reordering of experience blocks
- `docx` for Word export, `@react-pdf/renderer` for US Letter PDF export
- No hardcoded AI model names — `lib/ai/modelRegistry.ts` resolves each provider's current model
  catalog at runtime and picks the right one for the task's cost/quality tier

## What's new in this pass

**Dynamic AI model selection (not pinned to any single snapshot):**
`lib/ai/modelRegistry.ts` calls each provider's own list-models endpoint, classifies what comes back
into fast / balanced / quality tiers by name pattern (not a hardcoded list), and picks the newest
stable model per tier. Resume parsing on a thin/short resume automatically upgrades to the quality
tier (better responsibility generation); parsing a full resume or applying a quick chat edit uses the
balanced tier to keep cost down. Settings > AI Models shows exactly what's currently resolving for
each provider. If a provider's API is unreachable, it falls back to a documented last-known-good model
rather than failing outright.

**Full account system:**
`/signup` collects full name, email, password, and confirm password, then sends a 6-digit email
verification code (`supabase.auth.verifyOtp`) instead of a magic link — configure Supabase's
"Confirm signup" email template to code mode for this to send a code rather than a link. `/signin`
is email + password. A Postgres trigger (`handle_new_user` in `schema.sql`) auto-creates the
`profiles` row on signup. Session state lives in a Zustand store (`lib/store/authStore.ts`), not
scattered `useState`.

**Full app shell, not a single page:**
A sidebar (`components/layout/Sidebar.tsx`) + `AppShell` wraps every authenticated route — Chat,
Candidates, Settings, Profile — each with their own layout.

**ChatGPT-style intake dashboard (`/chat`):**
The main landing page is a chat interface: attach a resume (PDF, `.docx`, legacy `.doc`, or `.txt`),
paste resume text directly into the composer, or just type. Every parsed resume is saved immediately
and surfaces as a card in the chat with a link straight into its builder page. Chat history persists
locally via Zustand.

**Candidates page (`/candidates`):**
Full table of every candidate — name, designation, email, phone, address, every certification, every
safety ticket — plus the same semantic search bar ("show me all inspectors with API 510 and 5+ years").

**Designations (configurable templates):**
Settings lets you add/remove designations (QC Inspector, API Inspector, Third Party Inspector, or any
custom title) — stored in a `designations` table, selectable per-resume in the builder.

**Drag-and-drop experience reordering:**
Experience blocks in the builder use `@dnd-kit` — grab the handle and reorder employment history
directly instead of only add/remove.

**Fonts — Times New Roman header, selectable body font:**
Settings and the builder both expose the font list: Times New Roman, Plus Jakarta Sans, Open Sans,
Inter, Poppins, Calibri, Arial. Whatever you pick applies to the resume body in the live preview, Word
export, and PDF export — but the header block (name / designation / company line) always renders in
Times New Roman regardless, per the Engrity standard. Word export uses the real font names (Word
resolves them locally); PDF export embeds metric-compatible, freely-licensed Google Fonts equivalents
(Tinos for Times New Roman, Arimo for Arial) since PDFs can't reference the user's installed fonts.

**Checkmark bullets — fixed in both exports:**
The previous exports drew the check mark as the Unicode glyph U+2713 in a plain text run, which
silently disappears in many Word/PDF renders because that glyph isn't in the embedded subset for
arbitrary fonts. Fixed properly, not patched around:
- **Word export** now draws the tick using the classic Wingdings-font trick (character code 0xFC),
  which Word always renders as a bold check mark regardless of the body font.
- **PDF export** now draws the tick as a small vector path (`<Svg><Path>`) instead of a text glyph —
  it can never fail to render because it isn't a font glyph at all.
- The live preview uses the same SVG path, so what you see while editing is exactly what exports.

## Getting started

1. `npm install`
2. Copy `.env.example` to `.env.local` — Supabase project, AI provider keys (only the ones you want
   available), Resend key. No model names to configure.
3. In Supabase: Auth > Email Templates > "Confirm signup" — switch to code delivery so `/signup`'s
   verification step gets a 6-digit code instead of a link.
4. Run `lib/supabase/schema.sql` in the Supabase SQL editor — creates `profiles` (with an auto-create
   trigger on signup), `designations` (pre-seeded with QC/API/Third Party Inspector), `resumes`,
   `resume_exports`, `resume_edit_log`, the `match_resumes` semantic search RPC, RLS policies, and a
   `resumes` storage bucket.
5. Add your logo at `public/engrity-logo.png` (used in the sidebar, live preview, PDF header, and Word
   header).
6. `npm run dev` and open `http://localhost:3000` — it redirects straight to `/signup` (via the
   middleware auth guard) if you're not signed in, or `/chat` if you are.

## What's implemented vs. still worth doing

**Fully implemented:** dynamic per-provider model resolution and tiering; sign-up with code
verification + sign-in; Zustand-backed session/builder/chat state; full app shell with sidebar nav;
chat-based resume intake with file attach (PDF/.docx/.doc/.txt) and paste support; Candidates page with
full extracted fields and semantic search; configurable designations; drag-and-drop experience
reordering; font selection with fixed Times-New-Roman header; fixed checkmark rendering in both
exports; Word and PDF export matching the Engrity template; AI chat sidecar for natural-language edits;
Supabase schema with RLS, storage bucket, and auto-profile trigger.

**Still worth doing:**
- Legacy `.doc` extraction is a best-effort binary text scrape client-side (flagged as
  "low confidence" in both the chat and builder UI) — for reliable `.doc` support, route it through a
  server-side conversion step (e.g. headless LibreOffice `soffice --convert-to docx`) before parsing.
- Role-based RLS refinement (`profiles.role`) if recruiters shouldn't see every candidate.
- A background job to re-embed resumes if you bulk-edit outside the app.
- Rate-limit the `/api/models` catalog refresh if you expect heavy concurrent Settings-page traffic
  (it's cached 6h in-memory per server instance, which is fine for normal use).
