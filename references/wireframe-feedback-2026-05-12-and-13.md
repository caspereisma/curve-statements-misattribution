# Data-matching wireframe — Ops feedback (May 12–18, 2026)

**Author:** Casper Eisma (synthesised from meeting transcripts by AI)
**Created:** 2026-05-18
**Last updated:** 2026-05-18 (added meetings 4 & 5; corrected Curve alias persistence note; locked Phase 1 scope)
**Status:** Living synthesis — Phase 1 scope locked; remaining items pending validation
**Wireframe reviewed:** `wireframes/data-matching/data-matching.html` on `main` post-PR-#5 (commit `ee4debe`). Served locally on port 4321 via `data-matching-wireframe` preview config.

## What this document is

A consolidated record of the feedback the NR team gave on the data-matching wireframe and the broader misattributed-recordings workflow across five meetings between 2026-05-12 and 2026-05-18. Each item is tagged with who said it and the meeting it came from, so future iteration discussions can quickly check provenance.

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

---

## (b) Specific changes to make to the wireframe

### 1. Split the workflow by ID type — phases now precise (Alice + Vitaliy)

- *"We never work on contracts and tracks at the same time."* (Alice, Meeting 3.)
- Phase scopes locked in Meeting 4:

| Phase | Scope | Output template |
|---|---|---|
| **1 (MVP)** | Assets with **no track ID**, excluding those that already have a real ISRC (they auto-match in Curve and don't need fuzzy matching). | Curve "ISRC + alias" upload template — **2 columns only**: ISRC and alias. |
| **2** | Assets with track ID but **no contract ID** — link to existing contract. | Contract-binding template (TBD). |
| **3** | Assets that don't exist in Curve at all — ingest as new tracks. | NRP-injection template. |

Reshape the top of the wireframe around these phases: top-level mode selector, with per-mode filters and column visibility.

### 2. Surface revenue prominently (Dean, strong)

- Add **Net Amount column to the master view**, sortable and visible without opening the right-side panel. Ops prioritise by revenue, not by unmapped count.
  - Real anecdote (Dean): low-value tracks ignored → performer later complained about ~€300 of cumulative missing payments.
- **Collapsed-duplicate parent rows must show a summed Net Amount**, so ops can sort versions-of-a-title by total revenue.
- **Currency:** don't pretend a single "EUR amount" suffices — some clients aren't on EUR. Decide how to present mixed-currency totals.

### 3. Multiple match candidates with scores per record (Casper, Meeting 5)

- Casper asked Vitaliy: *"could a track have multiple potential matches from the NRP?"* — Vitaliy: **yes**.
- **Implication:** the focus panel needs to show a **ranked list of candidate matches** per unmapped record, each with its match percentage, with a recommendation highlighted. User picks one (or declines all and defers / flags for manual investigation).
- This supersedes the simpler "show one suggestion" approach hinted at in earlier feedback.

### 4. "Golden ISRC" suggestion — deferred to iteration 2 (Alice + Dean)

- For a given track title, propose the ISRC that (a) appears most often across the data and/or (b) carries the highest net amount, and offer **"map all variants to this ISRC"**.
- **Alice explicitly deferred this to a second iteration in Meeting 4**: *"if we try and find a way to look for in curve export the ISRC's that have been used most frequently just so that we're not matching to like different ISRC's each time. But I think maybe that's like the second iteration if we try and get the fuzzy matching going first."*
- Dean called the V2 version a **"golden recording"** — a marked canonical version when multiple legitimate ISRCs exist (e.g., *"Apologize"* + 5 remixes).

### 5. Three explicit unmapped categories (Vitaliy + Alice agree)

Replace or augment "Mapping Status: Mapped / Unmapped" with category-aware triage — it determines the right action and matches the phase scopes in §b.1:

| Category | Meaning | Phase | Action |
|---|---|---|---|
| **No Track ID (with alias, no ISRC)** | Track was never ingested into Curve; CMO sent only a track-title alias | **1 (MVP)** | Fuzzy-match → ISRC + alias upload to Curve |
| **No Track ID (with ISRC)** | Has a real ISRC but isn't in Curve | excluded from fuzzy matching | Direct ISRC ingest (no matching needed) |
| **Track ID but no Contract ID** | Exists in Curve, no contract link | **2** | Link to contract |
| **Missing both** | Rarest; needs investigation | **3** | NRP injection |

Today's two-state pill is too coarse — update the top tab pills, the Mapping Status column, and the filter logic.

### 6. Show match-context inline (Alice, Meeting 4)

- The review surface (whether spreadsheet or wireframe) must let the user compare side-by-side:
  - **From Curve export:** alias, track title, artist (and version when present).
  - **From NRP prod:** ISRC, track title, artist.
  - **Match percentage.**
- Implication for the focus panel: rather than just showing the unmapped record's fields, show **a two-column comparison** for each candidate match, with the score.

### 7. Audit history / persistent alias log (Dean + Casper)

- Every mapping decision must be timestamped and reversible — *"you need to know that you did this action at some point right to this recording"* (Dean, Meeting 1) — for dispute resolution downstream.
- Casper in Meeting 5: *"I think we should be holding this alias ourselves."* Vitaliy agreed to store the ISRC↔alias mapping history on the prod side in parallel with the Curve upload, as a safety net and to enable future automated matching.

### 8. Output file shape (Alice, locked Meeting 4)

- **Phase 1 export = the "January 10th" Curve upload template**, 2-column format (ISRC + alias). Template is stable; Alice and Filip confirmed they don't plan to change it.
- Phase 2 export = contract-binding template (format TBD).
- Phase 3 export = NRP-injection template (format TBD — Vitaliy mentioned this in Meeting 5).

### 9. Fuzzy matching algorithm is real now (Meeting 4)

- The match suggestions in the prototype were stubbed (*"At this moment it's just made up. There's no logic behind it."* — Casper, Meeting 1).
- Vitaliy has now implemented the real Phase 1 matcher (Meeting 5) and was testing it the day of writing. See §e for the algorithm.

---

## (c) Data / domain clarifications surfaced during the demos

1. **Two matching paradigms** (Dean, Meeting 1) — some CMO payments are **by performer/contract** (society sends "for Dean + a list of recordings"), others **by track/recording** (society sends line items, we infer the performer). Both flows must be representable.
2. **Catalog Type field** (Dean) — questioned whether it ever varies across versions of one track; may be redundant in the UI.
3. **Data quality is poor** (Alice, Meeting 3) — tracks come with incorrect ISRCs (e.g., Justin Bieber metadata on a Fontaines DC record), require manual verification, and sometimes shouldn't be matched at all (CMO misallocations). Human eyes are mandatory.
4. **Curve alias persistence — CORRECTED in Meeting 4.** Aliases **uploaded via the Curve template do persist in Curve**: *"Once we've put an alias into curve, it's always there. So like the ones that we have to match this time, next time if the CMO sends it in the exact same format, like we won't have to match it again. It will just auto match."* (Alice.) An earlier note in this document had this backwards. The team will still keep a parallel mapping log on the prod side (§b.7) for resilience and dispute-handling, not because Curve loses the data.
5. **Reprocessing delay** (Alice, Meeting 4) — uploaded aliases don't surface on the *next* Curve export until associated files are reprocessed. Quarterly cadence by default; potentially more frequent if the workflow proves efficient.
6. **Title + version arrive as one field** (Alice, Meeting 4) — Curve exports combine track title and version into a single field. Fuzzy matcher must account for this when extracting the version.
7. **Unmapped volume** (Casper, Meeting 1) — ~200,000 of ~850,000 records unmapped in the dataset (23.5%). Doesn't match earlier statements that "there aren't many unmapped" — needs reconciliation.

---

## (d) Open questions to resolve before MVP

1. **Currency handling** — how to present amounts when clients receive payments in non-EUR currencies?
2. **Spotify API access** — current rules for extended-data access need double-checking; may require premium licence (Vitaliy + Casper, Meeting 2).
3. **One file or two for phase 2/3?** — should later phases combine outputs or stay split?
4. **Match-score threshold value** — Meeting 4 floated 80% / 85% / 90% / 95% without locking. Will be tuned during the first review cycle. Initial review file will include all matches (no auto-accept) so the team can calibrate.
5. **Wireframe vs. spreadsheet** — Phase 1 review starts in a spreadsheet (§e). When does the wireframe become the primary review surface? Likely when volume + repetition justify it, or when audit/history features (§b.7) become essential.
6. **Success metrics** (Dean) — measure **(i) time spent per statement run** (primary) and **(ii) % unmapped before vs. after** (secondary; already low, so speed matters more).

> Items resolved since the previous version: scope of MVP (locked to Phase 1, see §b.1); Curve alias persistence (clarified in §c.4); Curve export template stability (locked to "January 10th" version in §b.8).

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

---

## MVP sequencing recap (Alice's advice, refined Meeting 4)

1. **Phase 1 — Track-ID matching (no-ISRC variant)** — fuzzy match, no-ISRC unmapped records → ISRC + alias upload.
2. **Phase 2 — Contract-ID matching** — needs ops conversation about edge cases (Tedder/KKR-style splits).
3. **Phase 3 — NRP injection** — for tracks that don't exist in Curve at all.

Direct-ISRC ingestion (records with real ISRC but no track ID) is excluded from fuzzy matching — they upload directly without needing this tool.

Target: usable MVP **before July**, co-authored proposal between Casper and Alice. Phase 1 implementation already in test as of 2026-05-18; first real review cycle expected the week of 2026-05-19.
