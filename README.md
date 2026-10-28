# Birchwind

Birchwind is a Windows-inspired web desktop that brings the original BirchBlock apps into one workspace.

## Built-in apps

- **Birch AI** — chat, tools, and saved memory.
- **Voice** — voice conversations and spoken replies.
- **Movies & TV** — discover movies and shows, browse title details, and launch available watch sources.
- **Music** — search tracks, albums, and artists, create playlists, and listen with the built-in player.
- **Birch Browser** — browse websites from the desktop.
- **Games** — browser games.
- **Notes** — local notes with search, pinning, and auto-save.
- **App Store** — install or remove app shortcuts from the Birchwind taskbar and app rail.
- **Settings** — layout, themes, accent colors, browsing preferences, privacy, and AI provider settings.

## Desktop controls

The taskbar includes Start, pinned apps, clock/date, and Quick Settings. Wi-Fi, Bluetooth, airplane mode, volume, and brightness controls are interface controls only; they do not change your device's actual hardware radios or operating-system volume/brightness.

## Storage and app installation

Notes and installed-app shortcuts are stored in this browser's local storage. They do not automatically sync to other browsers or devices. App Store install/remove controls change Birchwind shortcuts; they do not install native software on the device.

## Configuration

Copy `.env.example` to `.env` and set the Supabase values for your project. Keep secrets out of Git. The AI app needs a model provider configured in **Settings → AI** or a hosted AI gateway key in the server environment.

## Development

```bash
bun install
bun run dev
bun run build
```

Vercel deploys from the `main` branch of [chickneboinki/Birchwind](https://github.com/chickneboinki/Birchwind).
