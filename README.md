# Kokovix — Personal Productivity (Local website)

This is a lightweight personal website scaffold you can run locally and later host online (GitHub Pages, Netlify, etc.).

Files created:
- `index.html` — main single-page app
- `css/style.css` — styles
- `js/app.js` — navigation and simple per-page notes (localStorage)

Run locally
1. Open `index.html` in a browser (double-click or `Open File` in your browser).
2. For a local server (optional), run a simple static server in the project folder, for example using Python:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000
```

Hosting suggestions
- GitHub Pages: create a repo, push these files to `main` branch, enable Pages from root.
- Netlify / Vercel: drag-and-drop the folder or connect the repo — they'll serve it for free.

Next steps you might want
- Add export/import for notes
- Add trackers, charts, or habit streak visualizations
- Connect to Google Drive / Notion if you want cloud sync
