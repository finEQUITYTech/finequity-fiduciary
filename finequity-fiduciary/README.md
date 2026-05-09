# finEQUITY Board Oversight Bot

This is the Netlify-ready version of the board oversight bot.

## Local setup

```bash
npm install
npm run build
```

To test the Netlify function locally, use Netlify CLI instead of plain Vite:

```bash
npm install -g netlify-cli
netlify dev
```

`npm run dev` starts only the Vite frontend and will not serve `/.netlify/functions/chat`.

## Netlify settings

If this folder is the root of your GitHub repo:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Environment variables required in Netlify:

- `ANTHROPIC_API_KEY` = your Anthropic API key
- Optional: `ANTHROPIC_MODEL` = `claude-sonnet-4-6`

Do not put the Anthropic API key in GitHub.
