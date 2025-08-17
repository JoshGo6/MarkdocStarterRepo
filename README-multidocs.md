# Multi-doc sets enabled

This archive enables **three** documentation sets with distinct side navs and content:

- `/docs` → v1 (maps to your original docs)
- `/v2`   → v2 (example content)
- `/v3`   → v3 (example content)

## Run

```
npm install
npm run dev
```

Open:
- http://localhost:3000/docs
- http://localhost:3000/v2
- http://localhost:3000/v3

Use the **Version** selector in the top nav to switch while preserving the rest of the URL when possible.

## Configure versions

Edit `nav/versions.json`. For each version:
- `key`: short id used by the API route (`/api/nav/{key}`)
- `docsRoot`: the `pages` path prefix (e.g. `/docs`, `/v2`)
- `sidenav`: filesystem path to a `sidenav.json`
