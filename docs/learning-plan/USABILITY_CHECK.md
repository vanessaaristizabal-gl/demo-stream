# Usability check: bulk-approval screen (15 minutes, with a colleague)

Only a person can do this one. Run it before the Friday October 30 check-in, then fill in the table.

**Setup.** `cd frontend && npm run dev`, sign in as `strategist@example.com` / `password`, open `/lab/bulk`. Reset the mock between participants: `curl -X POST localhost:5173/api/lab/reset`.

**Task to give (read it, then stay silent and do not help):**
"Your team asked to raise the daily budget of 300 campaigns by 10%. Approve the change. Afterwards, tell me how many campaigns were not updated and why, and get them updated."

**Watch for (do not prompt):** did they find held items and understand why? did they notice the result without being told? did they understand "rate limit" vs "rejected"? did they find Retry? did they finish by keyboard if they tried?

| Time | What they did or said | Where they hesitated | What I changed (or why not) |
| ---- | --------------------- | -------------------- | --------------------------- |
|      |                       |                      |                             |

Log each change as a row in `REVIEW_LOG.md` (artifact: the screen; what was wrong: the observation).
