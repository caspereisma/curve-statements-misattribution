# Curve Statements Export — Deduced Data Manipulations

**Author:** Casper Eisma (coached deduction by AI)
**Created:** 2026-05-12
**Status:** First-pass hypothesis — pending validation by Ops team
**Source spreadsheet:** [Curve statements export](https://docs.google.com/spreadsheets/d/1KSnAHTUpZR-NsIYDGEsVXBTezDoM-6357N5gYhRO_1Y/edit) (Google Sheets, ~150 rows × 18 cols, 8 CMOs sampled)
**Methodology:** Build-and-iterate Phase 7 of `jtbd-job-identifier-sdd` — see [`Songtrust/nr-product`/NR-JTBD-002](https://github.com/Songtrust/nr-product/blob/main/research/synthesis/NR-JTBD-002-trusted-royalty-custodian.md).

## What this document is

A deduced list of the data manipulations the NR Ops team performs on the Curve "unmapped catalog" CSV export — the working spreadsheet at the start of the statement-run matching workflow. The list was inferred by triangulating:

- The spreadsheet sample itself ([1KSnAHTUpZR…](https://docs.google.com/spreadsheets/d/1KSnAHTUpZR-NsIYDGEsVXBTezDoM-6357N5gYhRO_1Y/edit))
- [NR-INT-007](https://github.com/Songtrust/nr-product/blob/main/research/interviews/NR-INT-007-dean-casper-roadmap-apr-17-2026.md) — Dean × Casper roadmap, 2026-04-17
- [NR-INT-008](https://github.com/Songtrust/nr-product/blob/main/research/interviews/NR-INT-008-misattributed-recordings-statement-run-apr-23-2026.md) — Misattributed recordings discovery round 1, 2026-04-23
- [NR-INT-009](https://github.com/Songtrust/nr-product/blob/main/research/interviews/NR-INT-009-misattributed-recordings-statement-run-ii-apr-28-2026.md) — Misattributed recordings discovery round 2, 2026-04-28
- [NR-JTBD-002](https://github.com/Songtrust/nr-product/blob/main/research/synthesis/NR-JTBD-002-trusted-royalty-custodian.md) — Trusted royalty custodian
- [NR-BRIEF-002](https://github.com/Songtrust/nr-product/blob/main/briefs/NR-BRIEF-002-statement-run-matching.md) — Statement-run matching

Each manipulation is tagged with an evidence source and a confidence indicator so the Ops team can quickly confirm, refine, or reject.

> **This is not a final list.** Per the build-and-iterate methodology in NR-BRIEF-002, the validated subset will become candidate Job Stories appended to NR-JTBD-002 via Phase 7 of the JTBD identifier skill.

---

## Spreadsheet structure (18 columns)

| # | Column | Observation |
|---|---|---|
| 1 | Sales File ID | Unique identifier per source-file ingest. Multiple rows share an ID = same ingested file. |
| 2 | Source | CMO name (sampled: ABRAMUS BR, PPL UK, INTERGRAM CZ, AIE ES, EJI HU, GVL DE, IFPI SE, RMNZ NZ). |
| 3 | Catalogue Type | Two values observed: `Contract` or `Track`. |
| 4 | Sale Date | Mostly valid `YYYY-MM-DD`. **PPL UK uniformly shows `0101-01-01`** — sentinel for missing/unknown sale date. |
| 5 | Transaction Date | `YYYY-MM-DD`; usually valid. |
| 6 | Original Track Artist | Artist string as it arrived on the CMO statement. Highly inconsistent: case, separators (`,` / `-` / `FEAT.` / `&`), multi-artist lists with parenthetical performer IDs (e.g. INTERGRAM CZ `Harry Deborah Ann (12766), Blondie (11296)...`). One row literally `NO DATA PROVIDED`. |
| 7 | Original Track Title | Title as arrived. Inconsistent case and punctuation. |
| 8 | Original ISRC | **Mixed semantics.** Either a real 12-char ISRC (`USUM71301306`, `GBAAA1100047`) **or** an alias-style concatenation when ISRC was missing (`PPLPayTrevorGADWHIP`, `ABRAMUSDOYOUCARINADIANNEROUNDDANIELBURNSWILLIAMJONMOHLER`). |
| 9 | Original Contract ID | Either a known client name (`Kryptic Media Limited`, `Twentythree Records Ltd`, `DOWNTOWN`) **or** an alias-style concatenation (`JUSTIN DREWBIEBERNO BRAINERUSSM11806283`, `RYAN BENJAMINTEDDERGOT 2 LUV YA...`). |
| 10 | Net Amount | Royalty in EUR-equivalent reference currency. Negative values present (PPL UK rebills/clawbacks). |
| 11 | Gross Amount | Equal to Net in this sample. |
| 12 | Net Amount in Currency | Royalty in original CMO currency. |
| 13 | Gross Amount in Currency | Equal to Net in this sample. |
| 14 | Original Currency | BRL, GBP, CZK, EUR, HUF, NZD, SEK observed. |
| 15 | Contract ID | **Internal Curve contract ID** (24-char hex). Populated when matched; empty when unmatched. |
| 16 | Track ID | **Internal Curve track ID** (24-char hex). Populated when matched; empty when unmatched. |
| 17 | Target Period | Quarter code with suffix: `DT` (Downtown rights-holder ingestion?) or `FUGA` (FUGA-side?). Sampled: `2026Q1DT`, `2025Q3DT`, `2025Q4DT`, `Q42024DT`, `2025Q3FUGA`, `2025Q4FUGA`. |
| 18 | (Status) | `Mapped` or `Unmapped`. |

---

## A. Classification / state derivation (columns the team adds with formulas)

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| A1 | **Add formula column: `mapped` vs `unmapped`** — if `Catalogue Type = Track` → require `Track ID` populated. If `Catalogue Type = Contract` → require both `Contract ID` and `Track ID`. | Alice, NR-INT-009 ~00:20:50 (direct quote); the export already has this column populated, suggesting it may also be a saved Curve report formula. | **High** |
| A2 | **Distinguish real ISRC vs alias on `Original ISRC`** — real ISRCs are 12 characters; aliases are longer (CMO+title+artist concatenated). | Alice, NR-INT-008 ~00:10:19 (*"12 characters long. Then I would pull those out"*). | **High** |
| A3 | **Flag PPL UK rows with sentinel date** — `Sale Date = 0101-01-01` is a placeholder for missing dates. | Inferred from data: every PPL UK row shows this uniformly. | **Medium** — not surfaced in interviews. |
| A4 | **Flag rows with no artist** — `Original Track Artist = "NO DATA PROVIDED"` or empty. | One row in sample: `PPLJonathanWhiteNODATAPROVIDED`. | **Medium** — visible in data only. |
| A5 | **Flag rows with zero/negative amounts** — PPL UK shows zero-amount lines and negative lines (rebills/clawbacks); handled separately. | Inferred from data structure; not directly named in interviews. | **Medium** |

## B. Filtering / subsetting

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| B1 | **Filter to current `Target Period`** (e.g. `2026Q1DT`), though Alice notes they often pull all periods to catch leftovers. | Alice, NR-INT-009 ~00:21:57 (direct quote). | **High** |
| B2 | **Filter on blank `Contract ID`** → list of contracts needing manual matching. | Alice, NR-INT-009 ~00:23:22 (*"contract IDs blank... 636 contracts that need matching"*). | **High** |
| B3 | **Filter on blank `Track ID`** → list of tracks needing matching. | Alice, NR-INT-009 ~00:23:22. | **High** |
| B4 | **Filter on `unmapped` rows only** (after applying A1 formula). | Alice, NR-INT-009 ~00:21:57. | **High** |
| B5 | **Filter by `Source = X`** to work one CMO at a time. | Inferred — the workflow is CMO-specific (templates, alias formats, contact differences). | **Medium** |

## C. Sorting / grouping

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| C1 | **Sort by `Original Track Title`** to batch-process repeats — e.g. 10 "Counting Stars" lines worked together. | Alice, NR-INT-009 ~00:25:26 (direct quote with Counting Stars example). | **High** |
| C2 | **Sort by `Original Track Artist`** for artist-batch matching, especially for multi-contract clients. | Inferred from One Republic / Justin Bieber / Tate McRae workflow descriptions. | **Medium** |

## D. Aggregation / summarisation

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| D1 | **Pivot table: mapped/unmapped count by `Target Period`** for at-a-glance status. | Alice, NR-INT-009 ~00:21:57 (*"put it into a pivot...get a summary"*). | **High** |
| D2 | **Pivot by CMO (Source)** to see which CMOs contribute most unmapped volume. | Inferred — useful operational view. | **Low / inference** |
| D3 | **Sum `Net Amount` by `Original Contract ID`** to reconcile against statement totals. | Inferred — standard reconciliation step. | **Medium** |
| D4 | **Sum amounts by Catalogue Type** (Contract rows vs Track rows) to verify totals. | Inferred. | **Low / inference** |

## E. Lookups / external cross-references

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| E1 | **VLOOKUP `Original ISRC` against NRP catalogue** to identify which unmatched-in-Curve lines DO exist in NRP. | Dean, NR-INT-007 (Diane's VLOOKUP workflow); Filip, NR-INT-009 ~00:37:26 (*"she does a lookup against one against the other"*). | **High** |
| E2 | **Cross-reference against master alias list** (Alice's personal Excel) — *"if I get One Republic Counting Stars I'll always put it to the same ISRC."* | Alice, NR-INT-009 ~00:41:30 (direct quote). | **High** |
| E3 | **Google to verify performer-on-album** — e.g. *"is Ryan Tedder on this Jennifer Hudson album?"* | Alice, NR-INT-008 ~00:27:50 (direct quote, Sound Exchange → Jasmine Sullivan / Jennifer Hudson case). | **High** |
| E4 | **Parse contributor strings for INTERGRAM CZ-style payloads** — massive multi-artist strings with parenthetical performer IDs (`Harry Deborah Ann (12766), Blondie (11296), ...`) need parsing to find the right NRP contract. | Inferred from data structure; interview hints at multi-artist complexity but doesn't name this exact pattern. | **Medium** |

## F. Deduplication / cleaning

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| F1 | **`Data → Remove Duplicates`** on Contract IDs after copying out — yields ~636 unique contracts per period. | Alice, NR-INT-009 ~00:23:22 (direct quote). | **High** |
| F2 | **Case-normalisation check** — match-breakage from capitalisation drift between statement runs. | Alice, NR-INT-009 ~00:26:41 (direct quote on case-sensitivity bug); the team manually re-cases to match. | **High** |
| F3 | **Trailing-whitespace / punctuation cleanup on alias-generation fields** — Filip flagged *"could be a space at the end of the one word."* | Filip, NR-INT-008 ~00:39:23. | **Medium** |

## G. Output file construction

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| G1 | **Build contract-alias upload file** — Column A = contract name in Curve; Column B = alias from CMO statement. | Alice, NR-INT-009 ~00:28:05 (direct quote and demo). | **High** |
| G2 | **Build track-alias upload file** — Column A = ISRC in Curve; Column B = alias. | Alice, NR-INT-009 ~00:29:02. | **High** |
| G3 | **Build new-track import file** — title + artist + ISRC tab, with separate ISRC + contract-name tab for new ISRCs not yet in Curve. | Alice, NR-INT-008 ~00:12:22. | **High** |

## H. Multi-contract attribution decisions

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| H1 | **For One Republic / Justin Bieber / Tate McRae / Shaggy** — use `Original ISRC` to pick between (e.g.) "One Republic KKR" vs "One Republic" NRP accounts. | Alice, NR-INT-009 ~00:25:26 (direct quote naming all four). | **High** |
| H2 | **Jason Mraz exception** — manual contract split; no ISRC-driven automation possible because NRP holds a single account despite multi-contract payouts. | Alice, NR-INT-009 ~00:25:26 (*"Jason Morz is not the same"*). | **High** |
| H3 | **Diane's "should this go to account A or B for Ryan Tedder?" decisions** at the QA step. | Alice, NR-INT-008 ~00:28:49 (KKR vs personal statement for Ryan Tedder). | **High** |

## I. Period & cadence handling

| # | Manipulation | Evidence | Confidence |
|---|---|---|---|
| I1 | **Recognise FUGA-suffix vs DT-suffix target periods** — `2025Q3FUGA` vs `2025Q3DT` — and route differently. | Inferred from data; not in interviews. Likely indicates which downstream ingestion pipeline. | **Low / inference** |
| I2 | **Hold over unmapped from prior quarters** — *"we often want to check things that haven't been matched in a previous period and work on them at the same time."* | Alice, NR-INT-009 ~00:21:57 (direct quote). | **High** |

---

## Unresolved questions the spreadsheet surfaces (not covered in interviews)

1. **What is `Catalogue Type = Track`?**
   The interviews describe a Contract-led match logic. The spreadsheet shows IFPI SE rows with `Catalogue Type = Track` and **no Contract ID even when mapped** (`66e22042..` track ID populated, Contract ID column empty). This suggests a parallel matching path for some CMOs that isn't surfaced in NR-INT-008/009 — possibly the FUGA-side rights-holder ingestion. **Worth probing the Ops team about.**

2. **Why is `Original Contract ID` sometimes an alias-style string vs. a real client name?**
   The team uses Curve aliases for *Contract ID* matching, not just for Track ID matching. The interviews describe contract aliasing for multi-contract clients only, but the spreadsheet shows it more broadly — including for clients with single contracts (`Twentythree Records Ltd`, `Kryptic Media Limited`). **Worth confirming the actual matching algorithm being applied here.**

---

## Confidence summary

| Confidence | Count | Items |
|---|---|---|
| **High** (direct interview quote or unambiguous data structure) | 18 | A1, A2, B1–B4, C1, D1, E1–E3, F1, F2, G1–G3, H1–H3, I2 |
| **Medium** (inference grounded in either interview or data) | 8 | A3, A4, A5, B5, C2, D3, E4, F3 |
| **Low** (pure inference) | 3 | D2, D4, I1 |

---

## Suggested next steps

1. **Walk-through with Alice + Farida** (~30 minutes) to confirm, refine, or reject each item. Expect ~half confirmed, ~quarter refined, ~quarter to be replaced by manipulations missed entirely.
2. **Use the validated subset as candidate Job Stories** for NR-JTBD-002 Phase 7 source integration. Each manipulation maps cleanly to a "When I'm processing the unmapped report, I want to..." story.
3. **Take the two unresolved questions into the Diane session** scheduled as a Gate 1 condition for NR-BRIEF-002.

## Methodology note (for downstream readers)

This document is a **first-pass hypothesis derived from artefact triangulation**, not a validated description of the team's actual workflow. The dual blind spot named in NR-JTBD-002 (Prod/Dev gap on the process × Ops gap on tacit decisions) is fully active here: the AI inferring this list has no direct observation of Ops work; the Ops team has not yet seen their own work described in this form. Both gaps are expected to close as this list is reviewed and corrected.

When this document is updated post-review, replace the "first-pass hypothesis" status with `validated YYYY-MM-DD by [names]` and note any manipulation that was rejected or replaced — preserving the original entry in a `Rejected during validation` section to maintain the audit trail back to the source artefacts.
