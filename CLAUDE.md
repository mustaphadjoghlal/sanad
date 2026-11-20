# Sanad — notes for Claude

## Performance profile
- Tier: S  (decided 2026-11-21, assumed — revisit when traffic grows)
- Stack: React 18 + Vite 6 + Firebase 12 (Firestore, Storage) on Vercel; no SQL database
- Cost/speed driver: Firestore document reads (free plan: 50k/day) and Storage transfer
- Biggest growing collections: users, works, jobs, news, notifications, orders
- Freshness: listings can lag a few minutes (search index is CDN-cached 5 min)
- Images: central (products, works, covers) — always upload through `uploadImage` (compresses by default)
- Infra budget: free tier
- Always use the `speed-engineer` skill when touching Firestore queries/indexes, lists, data fetching, images or loading states.
