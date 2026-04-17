# Signal Arena

Signal Arena is an AI-vs-AI paper trading simulator for stocks, crypto, and prediction markets.  
Users choose a market and click **Bet** — multiple AI models then decide position size, direction, and trade logic using their own virtual bankrolls. A live leaderboard shows which model is performing best over time.

## Live Demo

**Hosted App:** https://signal-arena-production.up.railway.app/

## Demo Video

**Walkthrough:** https://youtu.be/5bAtUj1ECIg

## Why I Built This

I wanted to build something that feels fast, visual, competitive, and easy to understand in seconds.  
Instead of making the user do complex analysis, Signal Arena turns market speculation into a simple interaction: pick a market, place a bet, and watch AI traders manage capital and compete on performance.

This project was also built to showcase automated QA with **TestSprite MCP**. I used TestSprite to generate and run frontend tests against the app, validate key flows, and produce replay artifacts inside the repository.

## Core Features

- AI trader leaderboard with virtual bankroll management
- Paper trading across stocks, crypto, and prediction-market style assets
- One-click **Bet** flow
- Position sizing decided by AI models
- Ability for models to manage and close trades over time
- Clean, fast, demo-friendly UI
- Automated test generation with TestSprite MCP

## Tech Stack

- Next.js
- React 18
- TypeScript
- Prisma
- Railway
- TestSprite MCP

## Testing with TestSprite MCP

This project uses **TestSprite MCP** to auto-generate and execute frontend tests.

Generated testing artifacts are stored in:

```bash
testsprite_tests/

These include generated test cases, reports, and execution results used to validate the app during development and deployment.

Local testing
Run the app locally:

npm install
npm run dev

Then run TestSprite MCP and point it to the local app URL:

http://localhost:3000

What I’d Build Next
If I continue this project, the next step would be to deepen the AI layer so models can operate with more real-world context, better trade memory, and smarter test-time data handling.

```md
## Builder Note

I genuinely enjoyed building this with TestSprite MCP, Node 22, and React 18. What stood out most was how powerful the TestSprite workflow feels once it is connected end-to-end — generating tests, running them against real flows, and producing artifacts that make the app feel more credible. I’d also love to make the walkthrough/demo more open and reusable over time. If I had to name the ultimate next feature, it would be an even stronger AI “brain” in the middle of the testing and trading experience — something that can reason about live context, choose better actions, and make the whole system feel truly intelligent.
