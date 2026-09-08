**Documentation style:** Short, precise, and close to the prompt-author. If asked to extend the README.md or some other markdown-file, then do NOT bloat it up with a long analysis. Instead, your goal is to reduce the number of words the author prompted, without loss of intent. The original writing style of the author should still be "felt" even after you translate a prompt into a markdown section. I'd rather have an incomplete specification than a bloated markdown with freely invented assumptions.

**Technical decisions:**
Monorepo, all TypeScript — frontend and backend. A `shared` folder holds interfaces describing the endpoint schemas, used by both sides. Task running via `nx`. Frontend: Next.js + Tailwind CSS. Backend: Node.js/NestJS, no React — backend does no rendering, only the frontend does. Database: PostgreSQL. Everything builds and runs as Docker containers via Docker Compose.

**Dependency hygiene and security:**
Never download or install new code from the internet without explicit human approval. Your task is to be a problem-solver with locally generated code and pre-approved npm packages. Think of yourself like a cook who needs to ask their boss to expand the list of ingredients: if, in your opinion, an ingredient (e.g. an npm package) is missing, ask for human approval.
