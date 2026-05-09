# finEQUITY Fiduciary Bot

Static Netlify version. No npm build is required.

## Netlify settings

If this folder is nested inside the GitHub repo:

- Base directory: `finequity-fiduciary`
- Build command: leave blank
- Publish directory: `finequity-fiduciary`
- Functions directory: `finequity-fiduciary/netlify/functions`

If these files are at the repo root:

- Base directory: leave blank
- Build command: leave blank
- Publish directory: `.`
- Functions directory: `netlify/functions`

## Environment variables

Add this in Netlify, not GitHub:

- `ANTHROPIC_API_KEY` = your Anthropic API key
- Optional: `ANTHROPIC_MODEL` = `claude-sonnet-4-6`
