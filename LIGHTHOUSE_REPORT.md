# PartsPro - LIGHTHOUSE_REPORT.md

## 2026-05-24 Local Production Audit

Target:

```txt
http://127.0.0.1:3001/it
```

Command:

```bash
env CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm_config_cache=/private/tmp/partspro-npm-cache npx --yes lighthouse@12.8.2 http://127.0.0.1:3001/it --only-categories=performance --output=json --output-path=/private/tmp/partspro-lighthouse-it.json --chrome-flags="--headless=new --no-sandbox --disable-gpu"
```

Result:

| Metric | Value |
|---|---:|
| Performance | 90 |
| First Contentful Paint | 0.9s |
| Largest Contentful Paint | 3.6s |
| Speed Index | 1.1s |
| Total Blocking Time | 0ms |
| Cumulative Layout Shift | 0 |
| Total Byte Weight | 352 KiB |
| DOM Size | 456 elements |

Status:

```txt
Lighthouse Performance > 85: passed
```

Notes:

- The audit was run against `next start` on the local production build.
- Lighthouse latest required Node 22, so this report uses Lighthouse 12.8.2 with the project Node 20 runtime.
- The local npm cache was redirected to `/private/tmp/partspro-npm-cache` to avoid mutating user-level npm cache permissions.
