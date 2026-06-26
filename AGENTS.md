<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## UI Language Rules
- **Use Plain Language**: Always use simple, direct words in the UI (e.g., "Staff" instead of "Personnel", "Orders" instead of "Orchestration").
- **No Jargon**: Avoid corporate or "agentic" bullshit. No "synchronization", "temporal dispatch", or "fiscal identity". Use "Sync", "Time", or "Financial Info".
- **Be Direct**: Text should be clear and functional. If a word sounds like it came from a corporate meeting, don't use it.
- **No AI-speak**: Never use "delve", "leverage", "empower", "ecosystem", "seamless", "robust", "transformative", "unlock", "optimize" in UI text. Use normal human words.

## Design System
- **Palette**: Slate-cobalt (neutrals + blue accents, no purple)
- **Typography**: Inter (body) + JetBrains Mono (data/code)
- **Style**: Data-dense, compact panels, precise separators
- **Text sizing**: Consistent scale — headings `text-xs font-bold`, labels `text-[10px] font-bold uppercase tracking-widest`, body `text-sm`, data values `text-sm font-bold`
- **Empty states**: Always show a short human message + an icon, never raw "No data"
- **Tables**: Consistent — `w-full bg-neutral-900 border border-neutral-800 rounded text-xs` for dark, striped rows
- **Buttons**: Consistent sizing — `py-3 px-6 text-xs font-bold uppercase tracking-widest`
- **Cards**: `bg-neutral-900 border border-neutral-800 rounded p-5`
- **Avoid**: Purple gradients, rounded-full buttons, excessive shadow, emoji as icons
<!-- END:nextjs-agent-rules -->
