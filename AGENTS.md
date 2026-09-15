<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Auto-Deployment & Git Sync Rules

- **Automatic GitHub & Vercel Sync**: Whenever you make any changes, bug fixes, or enhancements to code or project files, you MUST automatically stage, commit, and push the changes to GitHub (`git push origin main`) before completing your response, so that GitHub and the live Vercel deployment engine are always kept synchronized.
- Ensure the build passes (`npm run build`) before pushing commits.
