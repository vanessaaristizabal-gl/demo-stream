[Labs Goal] Vanessa Aristizabal — Stream Platform: Demo Preparation + Laravel/Vue Stack Study

Description

Summary:

Prepare the Stream campaign operations platform demo for Wednesday, Oct 21, and use the same window to learn the stack it is built on (Laravel, Vue 3 + TypeScript, Pinia, Storybook, Playwright). Stream governs every change to Google Ads and Meta campaigns for car dealerships through a single write path: resolve against live state, compliance check, approval, dry run, write and receipt.

Why:

Stream is the reference build for the Sr. Full Stack Engineer role (campaign operations platform for an automotive marketing agency, about 1,600 ad accounts). The role is backend-heavy and requires Laravel, Vue, idempotent writes to third-party APIs, rules and template engines, and clear English when presenting to US stakeholders. My background is web development in React and Angular, and back end in Node and PHP (an older version); I have not worked with Laravel or Vue. The study maps what I already know to this stack, and the demo checks that I can explain it and defend its design decisions.

Deliverables / Outputs:

Keep the daily Notes log updated.

Run the app locally (backend, frontend, Storybook) and rehearse the demo in English at least twice before Wednesday: login by role, request and approve a change, changelog receipt, emergency stop, architecture overview, Storybook design system, and the quality gates (backend, unit and Playwright tests).

Study about 20-30 min per day with active recall (answer before checking), covering: the governed write path and idempotency, module boundaries, Laravel request lifecycle, queues and tests, Vue 3 and Pinia compared with React/Angular, and how the Claude Code agents, skills and hooks are used in the repo.

Prepare short answers for likely questions: modular monolith vs microservices, how partial failures are handled, what is not verified yet (Google Ads and Meta providers on live accounts), and how AI recommendations could be added safely.

Make one small change with agent assistance, review the generated diff, and run the checks.

Reference: docs/PROJECT_GUIDE.md (run, verify and tooling guide), docs/architecture.md and the job description.
