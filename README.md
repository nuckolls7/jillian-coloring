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

Rooms can now contain multiple pages. Switching pages is local to each person, so one person can stay on one page while someone else opens another page in the same room. The artwork on each page is still shared when people color or draw on that page.

Use the bottom left and bottom right arrows on the canvas to flip through the current room/session pages like a coloring book. Page movement stays in the bottom arrows, not a dropdown.

The **Name** section renames the current page/canvas. Page names are saved with each page and are separate from the original theme/template name.

The phone/Wi-Fi URL can change if the laptop joins a different network. To check the current URL while the server is running, open:

```text
http://localhost:4173/host-info
```

## Save And Continue

Rooms are live while someone is connected. If everyone leaves, the live Room ID can be recycled later. Press **Save** to store the current work in this browser's **Art Room**. Art Room saves use a separate saved session ID, so a future room can reuse the same 5-character Room ID without overwriting old saved art.

The app does not reopen your last Room ID automatically. Each new visit starts with a fresh Room ID. Use **Art Room** on the home screen to return to saved sessions in this browser, or use **Export Save** and **Import Save** to move work to another browser.

Saved sessions can include multiple pages, click-fill colors, uploaded page data, image-canvas fill snapshots, and freehand drawing strokes.

## Upload Coloring Pages

Use **Upload Coloring Page** for PNG, JPG, WebP, or SVG files. Uploaded pages are saved in this browser and become pages inside the current room. They support click-to-fill coloring and freehand drawing on top.

Use **New Blank Drawing Page** to add an empty drawing page to the current room.

Use **Add Theme Page** to open the full theme gallery from inside a room. The theme gallery shows all available categories and coloring pages. Choosing a theme picture creates a new page copy in the current room/session with its own page ID, name, fill data, and drawing data. Other users stay on their current page.

## Tools And Palettes

Use **Fill**, **Fill Erase**, and **Pick** for click-to-fill coloring. Use **Draw**, **Brush Erase**, and **Brush Size** for freehand drawing on top of any page.

The palette has several built-in sets: basic colors, pastels, dark tones, skin tones, nature colors, and neon colors. Use the palette arrows to switch sets. Custom colors chosen with the color picker are saved into reusable blank palette slots in this browser.

## Seasonal Pages

The theme gallery loads built-in seasonal image pages from `pages/manifest.json` and the folders under `pages/`:

- `pages/Winter`
- `pages/Fall`
- `pages/Spring`
- `pages/Summer`

When updating GitHub, upload the whole `pages` folder along with code changes so Render can serve the seasonal images.

## Public Website

To make Jillian Coloring work from anywhere, deploy this Node app to a public host. Once deployed, people on different Wi-Fi networks can use the same public website URL and Room ID to color together.

Deployment notes are in [DEPLOYMENT.md](DEPLOYMENT.md).
