# Skills

Install from skills.sh — do not write custom skill files.

## Install skills for this project
```bash
npx skills add cloudflare/skills --all    # CF platform skills (wrangler, workers-best-practices, etc.)
npx skills add vercel-labs/agent-skills --all   # React best practices
```

Then remove irrelevant skills:
```bash
cd .agents/skills && rm -rf <unused-skill-dirs>
```

## Skills for common project types
| Project type | Skills to keep |
|---|---|
| CF Pages + React + Workers AI | `cloudflare`, `wrangler`, `workers-best-practices`, `vercel-react-best-practices` |
| CF Pages + D1 | `cloudflare`, `wrangler`, `workers-best-practices` |
| CF Agents / Durable Objects | `cloudflare`, `wrangler`, `agents-sdk`, `durable-objects` |
