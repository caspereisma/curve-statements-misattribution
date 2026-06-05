# Misattributed lo-fi concept feedback - ongoing

**Author:** Casper Eisma (synthesised from meeting transcripts by AI)
**Created:** 2026-05-18
**Last updated:** 2026-05-28 (added meetings 6–9 covering Misattributed IV / V / VI / VII; quarterly cadence locked; matching surface moved from concept to live prototype at `https://nr-stag.downtownmusic.com/curve-unmapped/runs/1/lines`)
**Status:** Living synthesis — Phase 1 scope locked; cadence and pipeline locked; matching algorithm and review surface now under iterative refinement on the live staging prototype
**Wireframe reviewed:** `wireframes/data-matching/data-matching.html` on `main` post-PR-#5 (commit `ee4debe`) for meetings 1–5. From meeting 6 onward the conversation pivoted to Vitaliy's live prototype on staging (`https://nr-stag.downtownmusic.com/curve-unmapped/runs/1/lines`); the lo-fi wireframe is now reference material rather than the live artefact.

## What this document is

A consolidated record of the feedback the NR team gave on the data-matching wireframe (meetings 1–5) and the live staging prototype that superseded it (meetings 6–9), spanning 2026-05-12 to 2026-05-28. Each item is tagged with who said it and the meeting it came from, so future iteration discussions can quickly check provenance.

The feedback is grouped by **(a) the biggest workflow realignment**, **(b) specific changes to make to the wireframe**, **(c) data / domain clarifications surfaced during the demos**, **(d) open questions to resolve before MVP**, and **(e) the matching algorithm + review pipeline locked on May 15**.

---

## Sources

| # | Meeting | Date | Voices giving feedback |
|---|---|---|---|
| 1 | NR Product weekly catchup | 2026-05-12 | **Dean Francis** (heavy) |
| 2 | NR Dev standup | 2026-05-13 | **Vitaliy Antipa** (light) |
| 3 | Misattributed recordings during statement run — III | 2026-05-13 | **Alice Storey** + **Filip Nallamilli** (heavy, most actionable) |
| 4 | Misattributed recordings: matching plan | 2026-05-15 | **Alice Storey** + **Filip Nallamilli** + **Vitaliy Antipa** — Phase 1 scope locked, matching algorithm agreed |
| 5 | NR Dev standup | 2026-05-18 | **Vitaliy Antipa** (implementation update) + **Casper Eisma** (UI implications) |
| 6 | Misattributed recordings during statement run — IV | 2026-05-19 | **Vitaliy Antipa** (alpha demo) + **Alice Storey** + **Filip Nallamilli** + **Dean Francis** — competing prototypes (Vitaliy's "Option A" vs Casper's "Option B") merged, duplicate-aliases / score filtering / universal search / pivot tables requested |
| 7 | Misattributed recordings during statement run — V | 2026-05-22 | **Alice Storey** + **Filip Nallamilli** + **Vitaliy Antipa** + **Dean Francis** — Vitaliy's prototype chosen as sole UI; track-title wrap; income+mapping count on candidates; match-score explanations; live "user test by proxy" with Alice driving |
| 8 | Misattributed VI | 2026-05-26 | **Filip Nallamilli** + **Dean Francis** + **Hlib Holynskyi** + **Vitaliy Antipa** (Alice absent) — field visibility tiers, click-through focus panel, June-as-test-period vs July automation, undo, original contract ID / client name pull-through, writer-name-in-artist edge case |
| 9 | Misattributed VII | 2026-05-28 | **Casper Eisma** + **Dean Francis** + **Hlib Holynskyi** + **Vitaliy Antipa** + **Alice Storey** — quarterly cadence locked, reject button, hide-processed-by-default, multi-candidate consistency rule, revalidation pipeline (sales file IDs + period unlock API) |

> Transcripts: Google Docs links held in chat history. Notes tabs ignored — feedback drawn from Transcript tabs only.

---

## (a) The biggest workflow realignment

**Alice (Meeting 3) reframed the entire flow.** Ops don't bulk-edit unmapped records inside an app. They download the unmapped CSV, prepare **separate Excel upload files for Curve** (one for track-ID matches, one for ISRC additions), and re-ingest. The tool is a **pre-mapping holding pattern**, not an editor.

Dean independently reinforced this in Meeting 1: *"We would never update the actual source file… this is more almost like a premapping mapping."*

**Vitaliy then sharpened the frame in Meeting 5**: the wireframe is the **human-review step in a larger pipeline**, modelled on the Farida ingestion pipeline. Pipeline shape:

```
Curve export ─► programmatic match ─► review file ─► manual decision (UI) ─► phase-specific upload template
```

with three phases (track-ID matching, contract matching, NRP injection) producing three different output templates.

**Implications for the wireframe:**
- Primary action is **"build an outbound match file"**, not "edit in place."
- The wireframe doesn't need to be the matching engine — it's the **human-in-the-loop review surface** between the matcher and the upload-template generator.
- For Phase 1, the very first iteration of the review surface is **a spreadsheet** (see §e). The wireframe is the next iteration of that review surface.

**Cadence locked in Meeting 9.** The matching workflow is a **single, quarterly event** triggered after statement runs — not an always-on process. Practical shape (Alice + Vitaliy):

- During the **last ~6 weeks of a quarter** (once royalties have uploaded the period's statements), Alice runs the pipeline.
- One Curve export → one run; subsequent re-runs in the same quarter pick up freshly added aliases and update the same event in place (not a new event per run).
- After Alice uploads the alias file into Curve, she must **revalidate** the affected sales files and **unlock** the period to pull the now-matched money into the new quarter. The prototype needs to surface the comma-separated list of sales-file IDs needed for revalidation (§e).
- Between quarters the surface is dormant — opening the page should default to "hide processed" (§b.16) so the user sees only outstanding work.

---

## (b) Specific changes to make to the wireframe

### 1. Split the workflow by ID type — phases now precise (Alice + Vitaliy)

| Feedback                                                                                                                              | Comments |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| *"We never work on contracts and tracks at the same time."* — never mix ID types in the same flow. (Alice, Meeting 3)           |          |
| Reshape the top of the wireframe around the three phases: top-level mode selector, with per-mode filters and column visibility. |          |

Phase scopes locked in Meeting 4:

| Phase | Scope | Output template |
|---|---|---|
| **1 (MVP)** | Assets with **no track ID**, excluding those that already have a real ISRC (they auto-match in Curve and don't need fuzzy matching). | Curve "ISRC + alias" upload template — **2 columns only**: ISRC and alias. |
| **2** | Assets with track ID but **no contract ID** — link to existing contract. | Contract-binding template (TBD). |
| **3** | Assets that don't exist in Curve at all — ingest as new tracks. | NRP-injection template. |

### 2. Surface revenue prominently (Dean, strong)

| Feedback                                                                                                                                                                                                                                                                     | Comments                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Add **Net Amount column to the master view**, sortable and visible without opening the right-side panel. Ops prioritise by revenue, not by unmapped count. Anecdote: low-value tracks ignored → performer later complained about ~€300 of cumulative missing payments.                                                 |
| **Collapsed-duplicate parent rows must show a summed Net Amount**, so ops can sort versions-of-a-title by total revenue.                                                                                                                                               | D                                             |
| **Currency:** don't pretend a single "EUR amount" suffices — some clients aren't on EUR. Decide how to present mixed-currency totals.                                                                                                                                Done. Display only Net amount euros in table nly  |

### 3. Multiple match candidates with scores per record (Casper, Meeting 5)

| Feedback | Comments |
|---|---|
| Focus panel shows a **ranked list of candidate matches** per unmapped record, each with its match percentage, with a recommendation highlighted. User picks one (or declines all and defers / flags for manual investigation). Confirmed by Vitaliy: a track *can* have multiple potential matches from NRP. Supersedes the simpler "show one suggestion" approach. | |

### 4. "Golden ISRC" suggestion — deferred to iteration 2 (Alice + Dean)

| Feedback | Comments |
|---|---|
| For a given track title, propose the ISRC that (a) appears most often across the data and/or (b) carries the highest net amount, and offer **"map all variants to this ISRC"**. Dean's V2 framing: a marked **"golden recording"** when multiple legitimate ISRCs exist (e.g. *"Apologize"* + 5 remixes). | Deferred to iteration 2 by Alice (Meeting 4) — get fuzzy matching working first. |

### 5. Three explicit unmapped categories (Vitaliy + Alice agree)

| Feedback | Comments |
|---|---|
| Replace or augment "Mapping Status: Mapped / Unmapped" with the category-aware triage below — update the top tab pills, the Mapping Status column, and the filter logic. Today's two-state pill is too coarse. | |

Category triage — matches the phase scopes in §b.1:

| Category | Meaning | Phase | Action |
|---|---|---|---|
| **No Track ID (with alias, no ISRC)** | Track was never ingested into Curve; CMO sent only a track-title alias | **1 (MVP)** | Fuzzy-match → ISRC + alias upload to Curve |
| **No Track ID (with ISRC)** | Has a real ISRC but isn't in Curve | excluded from fuzzy matching | Direct ISRC ingest (no matching needed) |
| **Track ID but no Contract ID** | Exists in Curve, no contract link | **2** | Link to contract |
| **Missing both** | Rarest; needs investigation | **3** | NRP injection |

### 6. Show match-context inline (Alice, Meeting 4)

| Feedback | Comments |
|---|---|
| Review surface (spreadsheet or wireframe) must let the user compare side-by-side: **Curve** (alias, track title, artist, version when present) vs. **NRP** (ISRC, track title, artist), with the match percentage. Focus panel = two-column comparison per candidate. | |

### 7. Audit history / persistent alias log (Dean + Casper)

| Feedback | Comments |
|---|---|
| Every mapping decision must be timestamped and reversible — *"you need to know that you did this action at some point right to this recording"* (Dean, Meeting 1) — for dispute resolution downstream. | |
| Store the ISRC↔alias mapping history on the prod side in parallel with the Curve upload, as a safety net and to enable future automated matching. (Casper + Vitaliy, Meeting 5) | |

### 8. Output file shape (Alice, locked Meeting 4)

| Feedback | Comments |
|---|---|
| **Phase 1 export** = the "January 10th" Curve upload template, 2-column format (ISRC + alias). Template is stable; Alice and Filip confirmed they don't plan to change it. | |
| **Phase 2 export** = contract-binding template (format TBD). | |
| **Phase 3 export** = NRP-injection template (format TBD — Vitaliy, Meeting 5). | |

### 9. Fuzzy matching algorithm is real now (Meeting 4)

| Feedback | Comments |
|---|---|
| The match suggestions in the prototype were stubbed (*"At this moment it's just made up. There's no logic behind it."* — Casper, Meeting 1). Vitaliy has now implemented the real Phase 1 matcher and was testing it on 2026-05-18. | See §e for the locked algorithm. |

### 10. Track-title display: wrap or version-in-grey (Filip + Casper, Meeting 7; reinforced Meeting 8)

| Feedback | Comments |
|---|---|
| Track titles get truncated in the table because version is concatenated into the title from Curve. Two acceptable patterns: **(a)** two-line wrap of title (with version visually distinct, e.g. grey subtitle below the title), or **(b)** thinner Contract-ID / Track-ID columns to reclaim screen real estate. The last bit of the title is the most operationally relevant — that's where the version sits. | Vitaliy noted Curve sends `title + subtitle` as a single combined string; splitting is non-trivial but required for clean display and matching. |

### 11. Score-based filter + bulk approve (Filip + Alice, Meeting 6; refined Meeting 7 + 9)

| Feedback | Comments |
|---|---|
| **Filter by match score** in the match-suggestions table (sort ascending/descending; filter "≥ 90%", "100% only", etc.). Workflow: filter to 100% → eyeball page-by-page → bulk approve → move to 90–99% manually → then sort by value for the long tail. | Already partially in the live prototype as of Meeting 9 (Vitaliy demoed 100% filter); needs hardening. |
| **Bulk approve action**: select-all on a filtered view (initially 100% matches), one click pushes them all to the upload list. From July, consider an explicit "approve all 100% matches" button at the top once confidence is established. | Decision Meeting 8: June = manual review / calibration period; bulk auto-approve gated until July. See §b.13. |

### 12. Field-visibility tiers in the table (Casper + Filip, Meeting 8)

| Feedback | Comments |
|---|---|
| Apply a **tiered visibility** to columns instead of showing every Curve / NRP field at full width: **fully visible** = Display Artist, ISRC Alias, Title, Version, Match Score, Net Amount; **on hover / collapsed** = Contract ID, Track ID, asset IDs; **detail panel only** = everything else. | Vitaliy to compile the "irrelevant fields" list and present for approval (Meeting 8 next-step). |

### 13. Hold off auto-approve through June; revisit in July (Alice + Casper, Meeting 8)

| Feedback | Comments |
|---|---|
| Use **June as the manual-review / calibration window** — every match decision goes through human eyes so anomalies surface (e.g. historical-income picking the wrong ISRC). From **July**, add a "bulk approve all 100% matches" button only after confidence is established. | Hard rule: never auto-approve until the team has explicitly signed off on a calibration period's worth of 100% matches. |

### 14. Click-through navigation in the focus panel (Casper, Meeting 8)

| Feedback | Comments |
|---|---|
| Focus panel = persistent "pinned" panel where the user can **cycle through candidates** with keyboard (tap down) or by clicking candidates in a list. Selecting a candidate immediately: (1) marks the source line as processed, (2) updates the table, (3) writes the mapping to the Track Aliases list, (4) advances the focus panel to the next outstanding sales line. | Today's drill-in/back-out flow is too costly at 7,000+ items; the focus panel must double as the keyboard-driven worklist navigator. |

### 15. Reject button (Hlib + Casper, Meeting 8 + 9)

| Feedback | Comments |
|---|---|
| Add an explicit **Reject** action on each match suggestion, distinct from "skip" or "don't approve." Rejected pairs feed the matcher as negative training signal so the same (alias, candidate) combination doesn't resurface at the top. Without reject, edge cases like the Korean version of an English title keep producing spurious 91% scores. | Triggered by Meeting 8 case study (`Korean lyrics on English-titled track` scoring 91%). |

### 16. Hide processed by default; surface "exported" status (Alice + Vitaliy, Meeting 9)

| Feedback | Comments |
|---|---|
| On page load, **filter "hide processed = true"** by default. Processed/exported lines remain accessible by toggling the filter — needed only when verifying that a prior export landed cleanly. | If something is wrong at the next run, the team toggles the filter; processed lines should still appear there (proves the upload-to-Curve loop worked). |

### 17. Original Contract ID + client names in the detail panel (Filip + Dean, Meeting 8; confirmed Meeting 9)

| Feedback | Comments |
|---|---|
| Add **Original Contract ID** (the raw value from the Curve export) plus the associated **client / performer names** to the detail panel — not the overview row. A single ISRC may have multiple performer contracts (e.g. drummer + singer + bassist on one Robert Plant recording); show all of them, comma-separated where they fit on a line. This is the field that lets ops verify whether a weird CMO allocation actually belongs to one of our clients. | Vitaliy: data is already in the export, just not surfaced. Decision Meeting 9: add to detail view, not overview row. |

### 18. Multi-candidate handling when no historical income exists (Alice + Vitaliy, Meeting 9)

| Feedback | Comments |
|---|---|
| When two or more NRP ISRCs match the same Curve alias at the same score **and neither has historical income**, the system must pick **deterministically** (always the same one across runs) — first candidate, alphabetical sort, or another stable rule. Today the system can recommend a different ISRC each run for the same alias, which leaks revenue to the wrong recording. | Vitaliy: ~500 multi-candidate 100% matches exist in the current export precisely because they have no income history to break ties. |

### 19. Match-reason / "why this score?" in the detail panel (Alice + Filip + Casper, Meeting 7)

| Feedback | Comments |
|---|---|
| Surface a **short, human-readable explanation** of the score at the top of the detail panel: which fields contributed, which deductions applied (e.g. "−5 for version mismatch"), whether the candidate was chosen by historical income, etc. Helps the team calibrate the rules and provides a feedback hook for future tuning. | Vitaliy had this in an earlier iteration, accidentally removed it during refactoring — to be reinstated. |

### 20. Lightweight in-product feedback (Casper, Meetings 7 + 8)

| Feedback | Comments |
|---|---|
| Allow the reviewer to **leave a short note on a match decision** (especially rejections), so we can later mine these for matcher-tuning patterns. | Hlib pushed back: in-product comment fields tend to be ignored long-term (citing PC fields precedent). **Interim solution (locked Meeting 8):** the Excel export already in use has a comment column — keep using that during the testing window rather than building UI for it. Revisit later. |

### 21. Universal search inside the matching surface (Filip + Dean, Meeting 6)

| Feedback | Comments |
|---|---|
| Add a **universal search box** on the match-suggestions / unmapped page that searches by artist or title against the NRP repertoire — not just by ISRC. Ops rarely know the ISRC in advance; they want to type "Lisa and Tori" and see candidate recordings. | The current flow forces a context-switch out of the matching page back to prod search, then back. |

### 22. Pivot-style operational dashboard (Alice + Filip, Meeting 6; refined Meeting 7)

| Feedback | Comments |
|---|---|
| Replicate the **CMO × period × mapped/unmapped/% unmapped** pivot table that ops currently maintain in Excel — either as a top-of-page strip on the match-suggestions tab or as a separate Stats view. Should react to the page's filters (period, CMO, etc.) so the totals update live. Doubles as an early-warning surface: if a CMO is showing 100% unmapped, the sales file probably has a problem. | Dean argued for a separate stats view to avoid clutter; Casper agreed, but high-level numbers (total mapped / unmapped, % processed, count of aliases mapped this run) can stay at the top of the match-suggestions page. |

### 23. Sum the alias value on collapsed duplicate rows (Alice, Meeting 6)

| Feedback | Comments |
|---|---|
| On the pending-approval / match-suggestions tab, **collapse duplicate sales lines for the same ISRC alias into one row and show the summed net amount** for that alias. Listing every individual sales line inflates the visible work and offers no extra signal — once you've matched the alias once, every sales line attached to it is also resolved. **Case sensitivity must be preserved** during de-duplication: Curve treats `ABC` and `abc` as distinct aliases. | Already partially in the prototype as "collapse duplicates"; needs the summed-value display and explicit case-sensitive grouping. |

### 24. CMO / society configuration cleanup (Hlib + Casper, Meeting 8)

| Feedback | Comments |
|---|---|
| Every CMO is duplicated in the dropdown — historical configuration issue (two records per society). Normalise to **one record per CMO**. | Distinct from the SX-prefix issue below. |
| Historical aliases carry an `SX` prefix that no longer applies. Verify whether Curve still emits the prefix; if not, strip it from existing records to prevent duplicate aliases. | Configuration check needed before mass-strip. |

### 25. Writer names in the artist field is a legitimate match (Filip, Meeting 8)

| Feedback | Comments |
|---|---|
| Some CMOs share data with publishing societies and include songwriter names alongside the actual performer in the artist field (e.g. "Aloe Blacc, Adam Paul, [writer]"). These should still match to the performer's recording — the matcher needs to recognise the brand-specific pattern, or at minimum the reviewer should be able to accept the match and leave a comment explaining why. | This is a class of "expected mismatch" that drops the score artificially today. |

### 26. Session-level workspace features (Hlib, Meeting 8)

| Feedback | Comments |
|---|---|
| **Undo per session**: if a reviewer realises mid-session that an earlier mapping was wrong, they should be able to undo it without leaving the page. Mechanics: on the Track Aliases tab, deleting the alias removes the mapping **and** returns the corresponding sales line to unprocessed in the match-suggestions list. | Mid-session mistakes are inevitable at the 7k-item scale; without undo, the only fix is to delete the alias in Curve later. |
| Attribute each match decision to the **user who made it** (sortable / filterable). Enables "who matched this" investigations later. | Lightly suggested ("gamification" framing from Hlib — counters per session, points per speed); Casper sees it as feeding the high-level dashboard (§b.22), not as a literal scoreboard. |

### 27. Delete row on the Track Aliases tab (Alice, Meetings 6 + 9)

| Feedback | Comments |
|---|---|
| On the Track Aliases tab, allow the user to **select and delete individual mappings** (and bulk-delete) directly — for correcting historical mistakes. Today the only correction path is to delete the alias in Curve manually. | Pair this with §b.26: deleting from Track Aliases must also reset the source sales-line status. |

---

## (c) Data / domain clarifications surfaced during the demos

1. **Two matching paradigms** (Dean, Meeting 1) — some CMO payments are **by performer/contract** (society sends "for Dean + a list of recordings"), others **by track/recording** (society sends line items, we infer the performer). Both flows must be representable.
2. **Catalog Type field** (Dean) — questioned whether it ever varies across versions of one track; may be redundant in the UI.
3. **Data quality is poor** (Alice, Meeting 3) — tracks come with incorrect ISRCs (e.g., Justin Bieber metadata on a Fontaines DC record), require manual verification, and sometimes shouldn't be matched at all (CMO misallocations). Human eyes are mandatory.
4. **Curve alias persistence — CORRECTED in Meeting 4.** Aliases **uploaded via the Curve template do persist in Curve**: *"Once we've put an alias into curve, it's always there. So like the ones that we have to match this time, next time if the CMO sends it in the exact same format, like we won't have to match it again. It will just auto match."* (Alice.) An earlier note in this document had this backwards. The team will still keep a parallel mapping log on the prod side (§b.7) for resilience and dispute-handling, not because Curve loses the data.
5. **Reprocessing delay** (Alice, Meeting 4) — uploaded aliases don't surface on the *next* Curve export until associated files are reprocessed. Quarterly cadence by default; potentially more frequent if the workflow proves efficient.
6. **Title + version arrive as one field** (Alice, Meeting 4) — Curve exports combine track title and version into a single field. Fuzzy matcher must account for this when extracting the version.
7. **Unmapped volume** (Casper, Meeting 1) — ~200,000 of ~850,000 records unmapped in the dataset (23.5%). Doesn't match earlier statements that "there aren't many unmapped" — needs reconciliation.
8. **Historical income data lives in the Curve export** (Vitaliy, Meeting 8). The same `unmapped + mapped` Curve export that drives the matcher already carries per-track income history — ~800,000 tracks of data. This is what powers the "pick the highest-earning ISRC when two candidates tie" rule. No separate data source required.
9. **Multi-candidate without history is a real subset** (Vitaliy, Meeting 9) — ~500 of the current 100% matches have **no historical income on either candidate**, so the income tiebreaker can't fire. These need the deterministic-pick rule (§b.18).
10. **Incorrect CMO payments → don't match, notify by email** (Filip, Meeting 8). When a CMO clearly pays us for a recording we don't represent, the procedure is: leave it unmatched in the tool, email the CMO. The next sales file from that CMO contains a negative-adjustment line that nets it back to zero. Volume is small (~handful per quarter, mostly identical track titles by different artists, e.g. *"Going to be All Right"*). Big-value incorrect payments are the operational risk — failing to catch one can leave a client account ~£2,000 in the red.
11. **Writer names sometimes show up in the artist field** (Filip, Meeting 8) — see §b.25. Brand-specific quirk where CMOs share data with publishing societies; not a data error, just a class of legitimate match the matcher needs to learn or the reviewer needs to override with a comment.
12. **CMO duplicates + SX prefix are historical config artefacts** (Hlib + Vitaliy, Meeting 8) — see §b.24. Both predate the current ingestion; they pollute filter dropdowns and inflate alias counts.
13. **Curve match correction has a quirk** (Alice, Meeting 9) — overriding a track-level link in Curve sometimes doesn't pick up; the reliable correction path is to delete the alias and re-create it. Volume of errors is very low (~10 in 4,000 tracks), and most are human copy-paste mistakes from the manual flow.
14. **Revalidation requires unlocking the period and adding sales-file IDs** (Alice + Vitaliy, Meeting 9). After uploading aliases to Curve, the affected sales files must be re-validated against the now-unlocked period for the matched money to flow into the new quarter. The bottleneck today is doing this one sales-file ID at a time; the prototype should output a copyable comma-separated list of IDs (Vitaliy confirmed a bulk-revalidate endpoint exists; period-unlock is via the period `update` endpoint, not a dedicated unlock call).

---

## (d) Open questions to resolve before MVP

1. **Currency handling** — how to present amounts when clients receive payments in non-EUR currencies? (Meeting 7 decision: display "Net amount EUR" only in the table; full-currency display deferred.) Still open at the dashboard layer (§b.22).
2. **Spotify API access** — current rules for extended-data access need double-checking; may require premium licence (Vitaliy + Casper, Meeting 2).
3. **One file or two for phase 2/3?** — should later phases combine outputs or stay split?
4. **Match-score auto-approve threshold** — Meetings 4 + 7 floated 80% / 85% / 90% / 95% without locking. Meeting 8 decision: **don't auto-approve during the June calibration window**; revisit in July with a "bulk approve all 100%" button as the first automation step. The score *filter* is built; the auto-approve trigger is not.
5. **Wireframe vs. spreadsheet** — Phase 1 review started in a spreadsheet (§e). Since Meeting 7 the live prototype is the primary review surface; the Excel export is the **interim feedback channel** (comment column) during the June calibration period. When in-product feedback (§b.20) lands, the spreadsheet retires.
6. **Success metrics** (Dean) — measure **(i) time spent per statement run** (primary) and **(ii) % unmapped before vs. after** (secondary; already low, so speed matters more).
7. **Period unlock via API** — Vitaliy to confirm whether the period `update` endpoint can flip the locked flag, since there is no dedicated unlock endpoint. Blocks fully automating the post-upload revalidation step (Meeting 9).
8. **Bulk revalidation input format** — endpoint exists, but it's unclear whether it accepts a comma-separated list of sales-file IDs or requires one call per ID. Vitaliy to verify (Meeting 9).
9. **Matcher rules document** — Vitaliy to share a written list of the rules / penalties currently in the fuzzy matcher (e.g. `−5` for version mismatch) so the team can review and propose amendments (Meeting 7 next-step; not yet circulated as of Meeting 9).
10. **Penalty calibration** — open cases where the score doesn't reflect the actual semantic distance: brackets / parentheses lowering the score more than an artist mismatch (Meeting 7); Korean version of an English title at 91% (Meeting 8); `featuring` differences pulling otherwise-identical tracks below 100%. Needs case-driven tuning, not a single threshold change.

> Items resolved since the previous version: scope of MVP (locked to Phase 1, see §b.1); Curve alias persistence (clarified in §c.4); Curve export template stability (locked to "January 10th" version in §b.8); cadence (locked quarterly post-statement-run, see §a + §e); 100% match handling when historical income exists (highest-value ISRC wins, see §b.18); whether to fold playlist matching into this surface (deferred — same UI patterns apply, but stay focused on the misattributed-recordings problem first, Meeting 7).

---

## (e) Matching algorithm + review pipeline — locked May 15

Decisions from Meeting 4, confirmed in Meeting 5 (Vitaliy has implemented and was testing May 18).

### Algorithm
- **Input:** Curve export, filtered to records with **no track ID and no real ISRC** (i.e., has a dummy ISRC / alias only).
- **Reference set:** NRP **prod repertoire** (not Curve internals).
- **Fields matched:** track title + version + artist (3 fields). Title and version arrive combined from Curve.
- **Output per row:** match score (percentage).

### Threshold workflow
- Start permissive (no auto-accept) so the team can calibrate scores against real matches.
- As confidence grows, set an auto-accept threshold (Alice/Filip floated 80–95%) — matches above auto-accept, matches below go to manual review.
- Goal (Alice): *"if it just cleared the bulk of it, like 80%, and we were manually doing the 20%, that's fine."*

### Review file format (first iteration — spreadsheet)
Each row contains:
- From Curve: alias, track title, artist.
- From prod: ISRC, track title, artist.
- Match percentage.

Ops filter this in Excel, then derive the Phase 1 upload template (ISRC + alias only).

### Pipeline architecture (Vitaliy, Meeting 5)
Modelled on the existing Farida ingestion pipeline:

1. Trigger = new Curve export.
2. Programmatic matcher produces review file.
3. Human reviews (Excel first; wireframe later).
4. Output = phase-specific upload template.
5. Mapping decisions also persisted to a prod-side alias log (§b.7).

Phase 1 implementation: complete, in test (as of Meeting 5, 2026-05-18). Vitaliy will share the first real review file in the following week.

### Updates from Meetings 6–9

- **Implementation milestone (Meeting 6, 2026-05-19):** Vitaliy spun up an alpha page in the NR portal (`Curve Pipelines`) supporting both automated Curve export-import and CSV upload. Fuzzy matching runs asynchronously (~6 minutes after a ~10-minute export). Default threshold `<70% → manual review`, `≥70% → pending review`, configurable on the backend.
- **Algorithm signal inputs (Meeting 8):** the matcher now considers title, subtitle (version), primary artist, display artist, and **historical income** from the Curve export. Match reasons are surfaced per candidate (e.g. *"picked over this ISRC because the matched ISRC has more historical income"*).
- **Tiebreaker rule (Meeting 8 + 9):** when multiple ISRCs tie at the same score, prefer the one with the highest historical net income. If no income history exists on any candidate, pick deterministically (see §b.18 — pending implementation).
- **Live cases driving rule changes:**
  - `−5` penalty for version mismatches (e.g. *Album Version* vs no version) — agreed as acceptable; flagged so reviewers recognise the pattern (Meetings 8 + 9).
  - Brackets/parentheses currently lower the score more than they should — open tuning item (Meeting 7).
  - Apostrophe / featuring-artist differences need controlled handling — open (Meeting 7).
- **Decision-state lifecycle (Meeting 6 + 9):**
  - `unprocessed` → reviewer takes action → `approved` (pending export) or `rejected`.
  - `approved` items roll into the Track Aliases tab.
  - Once the export is uploaded into Curve and confirmed received, the decision moves to `resolved` so it disappears from the active list — verifiable via toggling "hide processed" off (§b.16).
- **Cadence (Meeting 9, locked):** quarterly, triggered during the last ~6 weeks of a quarter. One run per quarter; re-triggering the Curve export refreshes the same run in place.
- **Revalidation step (Meeting 9):**
  1. Reviewer approves matches → exports the Curve template.
  2. Aliases uploaded into Curve.
  3. For each affected sales file: unlock the period and revalidate. Bulk-revalidate endpoint exists; period-unlock investigation pending (§d.7–8).
  4. Updated values flow into the new quarter; matched lines disappear from the next Curve export.
- **Surface scope decision (Meeting 7):** the live staging prototype is the sole review surface going forward. Casper's lo-fi wireframe is parked; its UI patterns (focus panel, grouping, tables-on-steroids) are reusable for future matching domains (e.g. playlist matching from CMOs) but those domains are out of scope until this one is solved.

---

## MVP sequencing recap (Alice's advice, refined Meeting 4)

1. **Phase 1 — Track-ID matching (no-ISRC variant)** — fuzzy match, no-ISRC unmapped records → ISRC + alias upload.
2. **Phase 2 — Contract-ID matching** — needs ops conversation about edge cases (Tedder/KKR-style splits).
3. **Phase 3 — NRP injection** — for tracks that don't exist in Curve at all.

Direct-ISRC ingestion (records with real ISRC but no track ID) is excluded from fuzzy matching — they upload directly without needing this tool.

Target: usable MVP **before July**, co-authored proposal between Casper and Alice. Phase 1 implementation in active use on the staging prototype since the week of 2026-05-19; **June 2026 is the calibration / manual-review window**, with bulk-approve automation gated until July (§b.13). First in-production statement run with this surface is targeted for the Q3 2026 statement window.
