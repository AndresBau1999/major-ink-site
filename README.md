# Major Ink Studios — website

Static multi-page site (HTML/CSS/JS, no build step). Hosted on Netlify at
majorinktattoostudios.com. Booking form posts to the separate
`major-ink-backend` repo (Express on Railway, emails via Resend).

## Pages
index, artists, gallery, locations, booking (+ styles.css, script.js)

## Where to edit
- Artists: `artists-data.js` (name, role, bio, portrait, photos); photos in `images/artists/<slug>/`
- Booking API URL: `BOOKING_API_URL` in `script.js` (currently https://major-ink-backend-production.up.railway.app/api/bookings)
- Backend CORS `ALLOWED_ORIGIN` must equal the site origin exactly (no trailing slash)

## Deploy
Netlify (free plan: ~15 credits per production deploy) — batch changes before deploying.
