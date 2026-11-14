# BAR MATH

**How fast can you load the bar?**

Instant-play barbell plate math for athletes, lifters, coaches, and beginners. No account required.

- Load the Bar
- What's on the Bar?
- Speed Round
- Plate Math Trainer

LB and KG Olympic plates. Progress saves on this device.

**Keyboard (Load the Bar):** `1`–`7` rack a plate, `Backspace` undo, `Enter` check, `Esc` clear.

Load both sides. Count the bar.

## Leaderboards

Speed rounds in Bar Math, Muscle and Bone post to public boards — per game,
per difficulty, for today, this week and all time (UTC). Each player holds one
place per board: their best round, ranked by correct answers, then accuracy.

The server grades every round itself. A speed round draws its questions from a
seed and records each answer; on submit the server replays that log through
the same question generators and scoring (`src/lib/leaderboard/speed.ts`) and
posts the totals **it** computes. The single-use round ticket is spent before
the round is judged, so a refused round cannot be resent with edited answers.
What this cannot stop is a program that plays the round correctly in real
time, within the per-minute caps in `src/lib/leaderboard/rules.ts`.

End-to-end check against the local dev server (it posts scores — never point
it at a deployed site):

```bash
PW_CHANNEL=chrome node --experimental-strip-types scripts/speed-verify-smoke.mjs http://127.0.0.1:8080/
```
