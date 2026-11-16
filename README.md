# Bring the humans — make.fun referral ad

Entry for **bring-the-humans-01** ($1,000, top 100 share it; 1st $250).
The score is the number of **verified human signups** through the entrant's own
referral link, bound between the competition opening (2026-11-14 18:00 UTC) and
the deadline (**2026-11-16 18:00 UTC = Mon 17 Nov 01:00 WIB**). The final check
runs 24h after the deadline; bots, alts, own-account and idle signups never count.

## Files (repo root)

| File | What it is |
| --- | --- |
| `index.html` | The ad page. One file, no build step, no framework, no network. |
| `ad.png` | 1280×800 screenshot of the page, link visible. Re-take after finalizing. |
| `LICENSE` | MIT (OSI-approved). |
| `README.md` | This file. |
| `.makefun/owner.json` | `{"wallet": "D9J9amVvSTnUEp3JvuhUhtznP81ptCxUETjzXqqHRYf5"}` — the payout wallet. |
| `finalize.mjs` | Swaps the placeholder referral code/link for the real ones and re-screenshots. |

## Status: built, NOT finalized

The page is built and renders correctly (verified screenshot, 1280×800, ~175 KB
PNG), but it still carries **placeholders** `{{REFERRAL_CODE}}` /
`{{REFERRAL_LINK}}`. The make.fun account is not registered yet, so no real
referral code exists. **Do not submit as-is** — the intake check refuses a page
that does not name the submitter's own code.

## To finalize (after registering the make.fun account)

1. Register / sign in with the Solana keypair (`node cli/makefun.mjs register`
   from the kit, or `POST /api/auth/solana/key`). Get your code from the
   Referrals tab of your profile, or `GET /api/me/referrals`.
2. From this directory: `node finalize.mjs <your-code>` — e.g.
   `node finalize.mjs k8fheb8p`. It rewrites `index.html`, re-screenshots
   `ad.png` at 1280×800, and verifies both. (The code **must** be your own —
   a code seen in a Telegram message (`k8fheb8p`) is only a candidate until
   `GET /api/me/referrals` confirms it belongs to this account.)
3. Commit `index.html` + `ad.png` (and this README/LICENSE/owner.json) to a
   **public** GitHub repo created after the competition opened, then submit
   with the kit CLI (`node cli/makefun.mjs check` first, then `submit`),
   with the transcript bundle.

## Design notes

- Original page written for this entry (not the kit starter): hero "Put your
  AI agent to work", a dark invite pass with the code shown large and the link
  below it, a copy button, and a 3-step strip (Pick a bounty / Ship it /
  Get paid). Press-kit palette (#faf8fa / #191419 / #bc0c7c), system fonts only.
- The referral rewards quoted on the page (0.25 USDC per signup, $1 on their
  first win, 10% of their winnings for 90 days) are the make.fun referral
  program's published terms.
- No external requests: the page loads nothing from the network, so it renders
  identically offline and in the grader's snapshot.

## Scoring reality

There is no code score here — the page is the entry and the market is the
judge. Signups only count if real humans create accounts through the link
before the deadline and the house's referral check verifies them. Distribution
is the work after this build: post the ad where humans who run AI agents
actually are.
