# Jillian Coloring

A small personal coloring website inspired by collaborative click-to-fill coloring activities.

## Run

```powershell
npm start
```

Open on this laptop:

```text
http://localhost:4173
```

Open from a phone or another device on the same Wi-Fi:

```text
http://10.5.210.20:4173
```

If the phone link does not open, make sure the phone is on the same Wi-Fi as this laptop and use `http://`, not `https://`.

## Use With Friends

Everyone should open the same server URL and enter the same 5-character Room ID. The Room ID is what joins people into the same canvas.

Invalid or expired Room IDs show a "Room ID invalid" message instead of opening a blank old room.

The phone/Wi-Fi URL can change if the laptop joins a different network. To check the current URL while the server is running, open:

```text
http://localhost:4173/host-info
```

## Save And Continue

Rooms are temporary until someone presses **Save**. If everyone leaves an unsaved room, that room and its coloring progress are discarded. Saved rooms keep their last saved snapshot while the server stays running; unsaved changes after that Save are discarded when the last person leaves.

The app does not reopen your last Room ID automatically. Each new visit starts with a fresh Room ID. Use **Export Save** to download a JSON backup, and **Import Save** to restore it later or move it to another browser.

## Upload Coloring Pages

Use **Upload Coloring Page** for PNG, JPG, WebP, or SVG files. Uploaded pages are saved in this browser and use click-to-fill canvas coloring for connected blank areas.

## Seasonal Pages

The theme dropdown loads built-in seasonal image pages from `pages/manifest.json` and the folders under `pages/`:

- `pages/Winter`
- `pages/Fall`
- `pages/Spring`
- `pages/Summer`

When updating GitHub, upload the whole `pages` folder along with code changes so Render can serve the seasonal images.

## Public Website

To make Jillian Coloring work from anywhere, deploy this Node app to a public host. Once deployed, people on different Wi-Fi networks can use the same public website URL and Room ID to color together.

Deployment notes are in [DEPLOYMENT.md](DEPLOYMENT.md).
