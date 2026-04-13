# 🌑 NoirScroll

> **A premium, minimalist Manga & Webtoon reader. Built for the reading purist.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-latest-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Apache_2.0-22c55e?style=flat-square)](./LICENSE)

![NoirScroll Preview](https://picsum.photos/seed/noirscroll/1200/500)

---

## What is NoirScroll?

**NoirScroll** is a high-performance, distraction-free manga and webtoon reader built around one philosophy: **the art comes first.**

No cluttered sidebars. No intrusive ads. No account required. Just you and the story.

It aggregates content from multiple providers for maximum availability, enriches metadata via AniList, and stores everything — your history, bookmarks, tags, and reading stats — **locally on your device**. Your data never leaves your hands.

---

## Features

### Core Reading Engine

The reader is the heart of NoirScroll, engineered to feel fast and fluid across every format.

| Feature | Description |
|---|---|
| **Webtoon Mode** | Continuous vertical scroll, optimized for Manhwa and Webtoon-style content |
| **Paged Mode** | Classic horizontal page-flip with full LTR and RTL direction support |
| **Pull-to-Transition** | Drag past the last page to smoothly transition into the next chapter |
| **Resume Reading** | Exact scroll position and page number saved per chapter, automatically |
| **Auto-Next Chapter** | Advances to the next chapter the instant you finish the current one |
| **Pinch-to-Zoom & Pan** | Full gesture support for zooming in on details, on mobile and desktop |
| **Chapter Progress Bar** | A sleek top-mounted bar shows your exact position within any chapter |
| **Tap-to-Toggle UI** | Tap the center of the screen to instantly show or hide all controls |

---

### Library & Organization

A centralized, fully offline hub for your reading collection.

- **Favorites** — Bookmark any title with a single tap to save it to your personal library.
- **Reading History** — Every opened title is automatically tracked alongside your last-read chapter.
- **Custom Tags / Folders** — Organize your library with tags you define yourself. Create labels like `Plan to Read`, `Dropped`, `Masterpieces`, or anything else. Filter your entire collection by tag instantly.
- **Read Status Tracking** — Chapters you've completed (90%+ read) are automatically greyed out in chapter lists so you always know exactly where you left off.

---

### Discovery & Search

- **Multi-Source Aggregation** — Fetches content from multiple providers (including Mangapill and AquaManga) simultaneously for broader coverage and higher availability.
- **Global Search** — One search query hits every supported source at once. Find any title regardless of which provider carries it.
- **Explore Page** — Browse trending and popular titles with high-resolution cover art and rich metadata.
- **AniList Integration** — Pulls detailed descriptions, genre tags, and community ratings from AniList for every title.

---

### Reading Statistics & Insights

A data-driven view of your reading habits, accessible from the Settings menu.

- 📚 **Total Chapters Read** — A lifetime count of your reading activity.
- ⏱️ **Time Spent Reading** — Actual minutes tracked inside the reader.
- 🎭 **Genre Breakdown** — A visual chart of your most-read genres (Action, Romance, Fantasy, and more).
- 🗓️ **Activity Log** — A record of your most recent reading sessions.

---

### Offline & PWA Capabilities

NoirScroll is a fully installable Progressive Web App.

- **Service Worker Caching** — The app shell and all assets are pre-cached via `vite-plugin-pwa`, keeping the app functional offline.
- **Smart Image Caching** — Recently read chapters and their images are cached automatically so you can continue reading without a connection.
- **Installable** — Add NoirScroll to your Home Screen on iOS or Android, or install it as a standalone desktop app. No app store required.
- **Bulk Download** *(Experimental)* — Manually prepare chapters for offline reading in advance.

---

### Personalization & Settings

- **Dark / Light Mode** — Fully responsive theming, defaulting to a deep Noir dark theme tuned for OLED screens.
- **Reading Direction** — Toggle between Left-to-Right (Western) and Right-to-Left (Manga) at any time.
- **Optimized Image Loading** — Fade-in animations and skeleton loaders prevent layout shifts and blank flashes during image fetch.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion (`motion/react`) |
| Icons | Lucide React |
| PWA | Vite Plugin PWA + Service Workers |
| Metadata API | AniList GraphQL |
| Content Sources | Mangapill, AquaManga (multi-source aggregation) |
| Storage | LocalStorage — no backend, no account required |

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/adwithch/noirscroll.git
cd noirscroll

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Build for production
npm run build
```

Open your browser and navigate to `http://localhost:5173`.

---

## Project Structure

```
noirscroll/
├── public/                  # Static assets & PWA manifest
├── src/
│   ├── components/
│   │   ├── reader/          # Core reading engine components
│   │   ├── library/         # Library, tags, and history views
│   │   └── ui/              # Shared primitives (modals, buttons, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Top-level route pages
│   ├── services/            # API clients & LocalStorage service
│   ├── store/               # Application state
│   └── types/               # TypeScript type definitions
├── vite.config.ts
└── tailwind.config.ts
```

---

## Legal Disclaimer

NoirScroll is a **content aggregator**. It does not host, store, upload, or distribute any manga, webtoons, or images. All content is sourced from third-party providers via public APIs and displayed solely within the app.

All intellectual property rights for manga and webtoon content belong to their respective creators, publishers, and licensors. Please support official releases whenever possible.

---

## Author

Built by **A.dwith**

[![Instagram](https://img.shields.io/badge/@a.dwith-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/a.dwith)
[![GitHub](https://img.shields.io/badge/@adwithch-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/adwithch)

---

## License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](./LICENSE) for full details.

---

*NoirScroll — Read without noise.*
