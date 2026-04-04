# Plan - Autonomous Collective Finance System (ArthaNetra)

Build a fully functional AI-governed chit fund system using Vite + React, integrating existing Stitch UI designs with complex financial logic and Claude-powered AI features.

## Scope

- **In:**
    - Tier 1: Core Engine (Group creation, Auction engine, Ledger, Trust Score).
    - Tier 2: AI Layer (Explainable AI Panel, Fund DNA evolution).
    - Tier 3: Wow Moments (Simulation Mode, Emotion Nudge).
    - Design System: Custom "Sovereign Ledger" dark theme.
- **Out:**
    - Real banking API integration (mocked for demo purposes).
    - Multi-currency support (₹ only).

## Action Items

[ ] **Step 1: Project Setup** - Initialize Vite + React project.
[ ] **Step 2: UI Extraction** - Convert Stitch HTML/CSS screens into modular React components (`Dashboard`, `Auction`, `Ledger`, etc.).
[ ] **Step 3: Core Logic** - Implement the `FundEngine` context to manage cycles, payment states, and bidding logic.
[ ] **Step 4: Trust Score Engine** - Design the 5-factor weighted algorithm for real-time member scores and ledger updates.
[ ] **Step 5: AI & "Fund DNA"** - Integrate Claude for explainable behavior responses and post-cycle rule mutations.
[ ] **Step 6: Simulation Mode** - Build the 30-second automated cycle with empathy nudge animations.
[ ] **Step 7: Ledger & Dashboard** - Implementing SHA-256 for event logs and real-time dashboard data binding.
[ ] **Step 8: Final Demo Prep** - End-to-end validation of the "Wow moments" and polish of transitions.

## Open Questions

- Should data be persistent (local storage or backend like Supabase)?
- Preferred Claude API platform for the AI features (Anthropic, Vertex AI, or AI SDK)?
- For the demo, do you want pre-populated sample members for the "Trust leaderboard"?
