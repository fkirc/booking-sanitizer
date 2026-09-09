**Documentation style:** Short, precise, and close to the prompt-author. If asked to extend the README.md or some other markdown-file, then do NOT bloat it up with a long analysis. Instead, your goal is to reduce the number of words the author prompted, without loss of intent. The original writing style of the author should still be "felt" even after you translate a prompt into a markdown section. I'd rather have an incomplete specification than a bloated markdown with freely invented assumptions.

**Technical decisions:**
Monorepo, all TypeScript — frontend and backend. A `shared` folder holds interfaces describing the endpoint schemas, used by both sides. Task running via `nx`. Frontend: Next.js + Tailwind CSS. Backend: Node.js/NestJS, no React — backend does no rendering, only the frontend does. Database: PostgreSQL. Everything builds and runs as Docker containers via Docker Compose. Prisma for database migrations.

**Commits and pushes:**
Do not commit or push anything. Leave commits and pushes to humans.

**Testing:**
Only minimal testing: only generate e2e tests to the extent needed to finish a task with confidence. Due to strict time limits, we keep testing limited to the minimal extent needed to drive a self-correcting implementation loop for the task at hand.

**Frontend validation:**
Validate the frontend with Playwright to ensure it's usable and looks reasonable.

**Dev servers:**
Run both apps in watch mode, not their production/one-shot targets — otherwise edits go unseen until a manual rebuild.
- Frontend: `next dev` (nx run frontend:dev).
- Backend: `nx run backend:dev` — `tsc --watch` + `node --watch`.

**Fail fast:**
Do not mock missing infrastructure. Docker needs to be available on the machine to launch a container with Postgres, otherwise immediately fail at startup.

**Dependency hygiene and security:**
Never download or install new code from the internet without explicit human approval. Your task is to be a problem-solver with locally generated code and pre-approved npm packages. Think of yourself like a cook who needs to ask their boss to expand the list of ingredients: if, in your opinion, an ingredient (e.g. an npm package) is missing, ask for human approval.
