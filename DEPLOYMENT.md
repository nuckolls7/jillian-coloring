# Deploy Jillian Coloring

Deploying the app to a public Node web service solves both current network limits:

- The site stays online without your laptop running.
- Friends on different Wi-Fi networks can open the same public URL and join the same Room ID.

## Recommended First Host: Render

This repo includes `package.json` and `render.yaml`, so Render can run the app as a Node web service.

1. Put this project in a GitHub repository.
2. In Render, create a new Web Service from that repository.
3. Use these settings if Render does not fill them automatically:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Runtime: Node
4. After the deploy finishes, open the `onrender.com` URL Render gives you.
5. Share that public URL and the 5-character Room ID with friends.

## Custom Website Name

To use a real domain like `jilliancoloring.com`:

1. Buy the domain from a registrar such as Namecheap, GoDaddy, Google Domains/Squarespace Domains, or Cloudflare Registrar.
2. Add that domain to the Render service under Custom Domains.
3. Copy the DNS records Render gives you into the domain registrar's DNS settings.
4. Wait for Render to verify the domain and issue HTTPS.

## Saving Rooms On A Host

The app still treats rooms as temporary unless someone presses **Save**.

Saved rooms are written to `DATA_DIR/rooms.json`. Locally, `DATA_DIR` defaults to `.data`. On a hosted service:

- Free hosts may restart, sleep, or delete local files.
- For saved rooms to survive deploys/restarts, use a paid persistent disk and set `DATA_DIR` to that disk path, such as `/var/data`.
- A database can replace file storage later if the site grows.

## Local Development

You can still run the laptop version:

```powershell
npm start
```

Then open:

```text
http://localhost:4173
```
