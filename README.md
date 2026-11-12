# Urvi Tours & Travells - Car Booking Site

Public website where clients see cars with their rate per km and send booking inquiries, plus a private admin panel to manage cars and follow up on inquiries by call or WhatsApp.

```
urvi-tours-travells/
  client/   React (Vite)   -> deploy on Vercel
  server/   Node/Express   -> deploy on Railway
                           -> database: TiDB Cloud (MySQL compatible)
```

## Pages

**Client side (public, no login):**

| URL | Page |
|---|---|
| `/` | Home: intro, popular cars, types of booking |
| `/cars` | All cars with rate per km, filter by type |
| `/cars/:id` | One car's details |
| `/book` (or `/book?car=ID`) | Booking inquiry form |
| `/thank-you` | Shown after sending an inquiry |

**Admin side (private, login required):**

| URL | Page |
|---|---|
| `/admin/login` | Login (the only public admin URL) |
| `/admin/inquiries` | Client inquiries, call / WhatsApp, status, follow-ups, notes, CSV export |
| `/admin/cars` | Add, edit, hide and delete cars and their rates per km |

Any `/admin/...` URL without a valid login redirects to `/admin/login`, and after signing in you land on the page you asked for. The backend also checks the login token on every admin API call.

**Admin login:** the email and password come from the server variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (set them in `server/.env` locally and in Railway for production). They are never stored in the client code or in git.

**Types of booking:** One way, Round trip, Local / hourly, Airport transfer (edit the list in `client/src/config.js` and `TRIP_TYPES` in `server/src/db.js`).

---

## 1. Run locally

You need Node 18+ and a MySQL-compatible database. The server creates the database and the three tables (`cars`, `inquiries`, `notes`) by itself on first start.

### Database for local development

Pick one:

**Docker**
```bash
docker run -d --name urvi-mysql -e MYSQL_ROOT_PASSWORD=root123 -p 3306:3306 -v urvi-mysql-data:/var/lib/mysql mysql:8
```
Wait about 20 seconds for it to start. If the name already exists: `docker start urvi-mysql`.

**Ubuntu without Docker**
```bash
sudo apt update && sudo apt install -y mysql-server
sudo systemctl start mysql
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123'; FLUSH PRIVILEGES;"
```

**Or** use your TiDB Cloud cluster directly, even for development (section 3, Step A).

### Server
```bash
cd server
cp .env.example .env
npm install
npm run start
```
Local `server/.env` (MySQL on your machine):
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123
DB_NAME=urvi_tours
DB_SSL=false

ADMIN_EMAIL=urvi.toursandtravells@gmail.com
ADMIN_PASSWORD=your-admin-password
JWT_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173
PORT=4000
```
`DB_SSL=false` is needed for a local MySQL. You should see `API listening on 4000`.

### Client (in a second terminal)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173. In development, Vite forwards `/api` requests to the server on port 4000, so no client `.env` is needed locally. Admin: http://localhost:5173/admin/login

---

## 2. Customise the public site

Edit `client/src/config.js`: business name, bio, Instagram link, phone number, WhatsApp number and trip types. Phone numbers are digits only with country code, e.g. `919876543210`.

---

## 3. Deploy

Order: database, then backend, then frontend, then update CORS.

### Step A: TiDB Cloud (database)
1. Sign up at tidbcloud.com and create a **Starter** cluster (check TiDB Cloud's pricing page for the current free quota).
2. Open the cluster and click **Connect**. Choose connection type **Public** and connect with **General** / Node.js. Click **Generate Password** and save it.
3. Note these four values: host (like `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`), port (`4000`), user (like `abc123xyz.root`, with the prefix), and the password.
4. No SQL to run by hand. The server creates the `urvi_tours` database and its tables on first start. If TiDB refuses to create a database for your user, set `DB_NAME=test` and it will use the default `test` database instead.

### Step B: Railway (backend)
1. Push the project to a GitHub repository.
2. In Railway: **New Project -> Deploy from GitHub repo** and pick the repo.
3. In the service **Settings**, set **Root Directory** to `server`. The start command `npm start` is picked up automatically.
4. Open **Variables** and add:

| Variable | Value |
|---|---|
| `DB_HOST` | from TiDB |
| `DB_PORT` | `4000` |
| `DB_USER` | from TiDB (with the prefix) |
| `DB_PASSWORD` | from TiDB |
| `DB_NAME` | `urvi_tours` |
| `DB_SSL` | `true` |
| `ADMIN_EMAIL` | `urvi.toursandtravells@gmail.com` |
| `ADMIN_PASSWORD` | your admin password |
| `JWT_SECRET` | long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_URL` | set after Step C; use `http://localhost:5173` for now |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional, see section 4 |

5. **Settings -> Networking -> Generate Domain**. Open `https://<your-service>.up.railway.app/health`. You should see `{"ok":true}`. If the deploy logs say `Database connection failed`, re-check the TiDB values.

### Step C: Vercel (frontend)
1. In Vercel: **Add New -> Project**, import the same repo.
2. Set **Root Directory** to `client`. Framework is detected as Vite.
3. Add environment variable `VITE_API_URL` = your Railway URL (no trailing slash).
4. Deploy. `client/vercel.json` already makes `/cars`, `/book` and `/admin/...` work when refreshed.

### Step D: Connect them
1. In Railway, set `CLIENT_URL` to your Vercel URL (and your custom domain if any), comma separated, no trailing slash:
   `https://yourdomain.com,https://your-project.vercel.app`
2. Railway redeploys automatically.
3. Open the site, send a test inquiry, then log in at `/admin/login`.

### Step E: Custom domain (optional, recommended)
Vercel: **Settings -> Domains**, add your domain and the DNS records it shows. HTTPS is automatic. Add the domain to `CLIENT_URL` on Railway.

### Step F: Instagram bio
Instagram app -> **Edit profile -> Links -> Add external link**:
`https://yourdomain.com/?utm_source=instagram`
The `utm_source` value is saved as the inquiry source.

---

## 4. Telegram alerts

1. In Telegram, message **@BotFather**, send `/newbot`, copy the token into `TELEGRAM_BOT_TOKEN`.
2. Send any message to your new bot.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` into `TELEGRAM_CHAT_ID`.

You get a message for each new inquiry, plus a **9:00 AM IST** summary of follow-ups due that day.

---

## 5. Using the admin panel

- **Cars & rates:** add a car with name, type, seats, rate per km and an optional photo. Hide a car to remove it from the public site without deleting it. Old inquiries keep the car name and rate they were booked at.
- **Inquiries:** tabs filter by status; **Due today** shows follow-ups due today or overdue. **Call** and **WhatsApp** buttons open your phone dialer or WhatsApp from the card. Set a status and follow-up date, and add notes after each call.
- **Export CSV** downloads all inquiries. Do this regularly as a backup.

---

## 6. Security and spam

- Public form: honeypot field, rate limit (5 per IP per 15 min), server-side validation of Indian mobile numbers, and parameterised SQL queries.
- Admin: password login with a signed token (7 days), login rate limit, every admin API route needs the token, admin pages send `noindex`.
- CORS allows only your listed sites. Helmet adds secure headers.
- Keep `ADMIN_PASSWORD`, `JWT_SECRET` and `DB_PASSWORD` only in environment variables, never in the repo. `.env` is git-ignored.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Login or pages show a 500 / "Backend is not running" locally | Start the server (`npm run start` in `server`) and read its message. |
| `Missing environment variables` | Create `server/.env` from `.env.example`. |
| `Database connection failed: connect ECONNREFUSED 127.0.0.1:3306` | Local MySQL is not running. Start the Docker container or `sudo systemctl start mysql`. |
| `Database connection failed: Access denied` | Wrong `DB_USER` or `DB_PASSWORD`. On TiDB the user includes a prefix such as `abc123xyz.root`. |
| TiDB: SSL or handshake errors | Make sure `DB_SSL=true` and `DB_PORT=4000`. For a local MySQL use `DB_SSL=false`. |
| Form says "Cannot reach the server" | Check `VITE_API_URL` on Vercel and redeploy (env vars apply at build time). |
| CORS error in the browser console | `CLIENT_URL` on Railway must exactly match the site URL, no trailing slash. |
| Refreshing `/admin/...` gives 404 on Vercel | Make sure `client/vercel.json` is deployed. |
| No Telegram message | Send your bot a message first; verify the chat id via `getUpdates`. |

## 8. Costs (check current prices before you commit)

- Railway: a paid Hobby plan is about $5 per month; its free plan is small. See railway.com/pricing.
- Vercel: the free Hobby plan is for non-commercial use only. A business site needs the Pro plan. See vercel.com/pricing.
- TiDB Cloud Starter: has a free quota. See pingcap.com/tidb-cloud-pricing.
- A custom domain costs roughly 700-900 rupees per year.
# urvi-tours-and-travels
