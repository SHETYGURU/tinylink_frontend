Here’s a `README.md` you can drop into your **frontend** folder 👇

````md
# TinyLink Frontend

A small React + Vite + Tailwind CSS dashboard for creating and managing short links, powered by the TinyLink backend API.

- Create short URLs (auto or custom code)
- Per-user links filtered by email
- Copy short URLs to clipboard
- See click counts and last clicked time
- Open / delete links with animated UI
- Responsive, minimal black & white theme

---

## 🏗 Tech Stack

- **React** (Vite)
- **Tailwind CSS**
- **Axios** for API calls
- **TinyLink Backend API** (Node + Express)  
  - Deployed on Railway (e.g. `https://tinylink-backend-production.up.railway.app`)

---

## 📁 Project Structure (frontend)

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── icons/
│       ├── create.gif
│       ├── opening.gif
│       ├── deleting.gif
│       ├── processing.gif
│       ├── email.gif
│       ├── email-error.gif
│       └── refresh.gif
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/
    │   └── Dashboard.jsx
    └── components/
        ├── LinkForm.jsx
        └── LinksTable.jsx
````

> ⚠️ The `.gif` files in `public/icons` are used for the UI animations (processing, opening, deleting, email popup, refresh, etc.).
> You should keep those file names consistent, or update the component imports if you rename them.

---

## 🔧 Environment Variables

Create a `.env` file in the **frontend** directory:

```env
VITE_API_URL=https://tinylink-backend-production.up.railway.app
VITE_REDIRECT_BASE=https://tinylink-backend-production.up.railway.app
VITE_BASE_URL=https://tinylinksite.netlify.app
```

* **`VITE_API_URL`** – base URL for the API, used for `/api/links` requests.
* **`VITE_REDIRECT_BASE`** – base URL used to construct the short URL shown to the user (e.g. `https://tinylink-backend-production.up.railway.app/abc123`).
* **`VITE_BASE_URL`** – the frontend base (used for stats link like `/code/:code` if you implement that page).

For **local development** (backend running on `localhost:4000` and frontend on `localhost:5173`), you can set:

```env
VITE_API_URL=http://localhost:4000
VITE_REDIRECT_BASE=http://localhost:4000
VITE_BASE_URL=http://localhost:5173
```

After changing `.env`, restart `npm run dev`.

---

## 🚀 Getting Started (Local)

From the `frontend` folder:

```bash
# install dependencies
npm install

# start dev server
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

Make sure your **backend** is also running (e.g. `npm run dev` in `backend/` with `PORT=4000`).

---

## 📦 Build for Production

```bash
npm run build
```

This generates static assets in `dist/`, which can be deployed to Netlify, Vercel, or any static hosting.

To preview the production build locally:

```bash
npm run preview
```

---

## 🧠 Features & Behavior

### 1. Email “Login” (per-user links)

* The app doesn’t have real auth; instead it uses an **email** to filter which links you see.

* On first **Create**:

  * If no email is stored yet, an **email popup** appears.
  * You must enter a valid email (`you@example.com` pattern).
  * That email is:

    * passed to the backend when creating links,
    * stored in React state, and
    * stored in `localStorage` as `tinylink_email`.

* On reload, the app reads `tinylink_email` from `localStorage` so the user stays “logged in” until they log out.

#### Logout / Change email

* On the right side of **“Target URL”** label, there is an email icon + **“Logout”** text.
* Clicking it:

  * clears the email from state,
  * removes `tinylink_email` from `localStorage`,
  * shows the email popup again on the next create.

### 2. Create Short Link (`LinkForm`)

Component: `src/components/LinkForm.jsx`

* Fields:

  * **Target URL**
  * **Custom code (optional)** – if provided, must be globally unique; the backend returns an error if the code already exists.
* Flow:

  1. User fills URL / optional custom code.
  2. User hits **Create**.
  3. If email is not set → email popup opens.
  4. Once email is valid:

     * A “Processing / Shortening URL…” overlay is shown with a GIF.
     * A `POST` is sent to `VITE_API_URL + /api/links` with `{ url, code?, email }`.
     * On success:

       * Inputs are cleared.
       * A success message shows the short URL built from `VITE_REDIRECT_BASE` and the returned `code`.
       * A **“Copy short URL”** button copies it to the clipboard.
       * `onCreated(email)` is called so the parent page can refresh the list for that email.

### 3. Links Table (`LinksTable`)

Component: `src/components/LinksTable.jsx`

* Displays **only the links for the current email**, fetched by the parent with `?email=...`.
* Features:

  * **Search** by code (input on the top left).
  * **Sort** dropdown: newest, clicks asc/desc, last clicked asc/desc.
  * **Refresh button** with `refresh.gif` – calls `onRefresh()` from parent to re-fetch from backend.
  * **Columns**:

    * Code (links to stats URL: `VITE_BASE_URL + /code/:code` if used)
    * Short URL (with small **Copy** icon button)
    * Target URL (truncated with tooltip)
    * Total clicks
    * Last clicked
    * Actions: **Open**, **Delete**

#### Open button

* Clicking **Open**:

  * Triggers a short animation where the text/icon fade into an `opening.gif`.
  * After ~1s, it opens the real short URL in a new tab: `VITE_REDIRECT_BASE + /:code`.
  * After opening, it calls `onRefresh()` so the **click count and last clicked timestamp update**.

#### Delete button

* Clicking **Delete** opens a **confirmation overlay**:

  * Shows the code being deleted.
  * On **Cancel** – closes the overlay.
  * On **Yes, delete**:

    * Shows a `deleting.gif` and “Deleting link…” for ~2s.
    * Calls `DELETE /api/links/:code` on the backend.
    * Calls `onRefresh()` to update the table.

---

## 🧩 Main Page (`Dashboard`)

Component: `src/pages/Dashboard.jsx` (or similar, depending on your setup)

Typical responsibilities:

* Holds `links`, `loading`, `currentEmail` in state.

* On mount or when `currentEmail` changes, fetches:

  ```js
  GET `${VITE_API_URL}/api/links?email=${encodeURIComponent(currentEmail)}`
  ```

* Passes:

  * `onCreated={fetchLinks}` and `currentEmail`, `setCurrentEmail` to `LinkForm`.
  * `links`, `loading`, `onRefresh={fetchLinks}` to `LinksTable`.

---

## 🌍 Deployment Notes

### Backend (Railway)

* Backend deployed (example):
  `https://tinylink-backend-production.up.railway.app`

* Important env vars on backend service:

  ```env
  DATABASE_URL=postgresql://...railway
  BASE_URL=https://tinylink-backend-production.up.railway.app
  FRONTEND_ORIGIN=https://tinylinksite.netlify.app
  NODE_ENV=production
  ```

* CORS in backend:

  ```js
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  app.use(
    cors({
      origin: allowedOrigin,
    })
  );
  ```

### Frontend (Netlify, etc.)

* Deploy the **build output** from `npm run build`.
* Make sure the frontend `.env` points to the public backend URL.

---

## 🐞 Troubleshooting

* **CORS error (`No 'Access-Control-Allow-Origin' header`):**

  * Check backend `FRONTEND_ORIGIN` matches *exactly* your frontend origin
    (no trailing slash, no quotes).

* **Network error / 502 from API:**

  * Open backend `/healthz` in browser:

    * e.g. `https://tinylink-backend-production.up.railway.app/healthz`
  * If not `{"ok":true}`, check Railway logs (likely DB connection or env vars).

* **Email popup keeps appearing even after entering email:**

  * Ensure `setCurrentEmail` is passed correctly from parent.
  * Check browser `localStorage` for key `tinylink_email`.

---

## 📝 Scripts (from package.json)

Typical scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx"
  }
}
```

Run them using:

```bash
npm run dev
npm run build
npm run preview
```

---

If you want, I can also write a short **backend README** to match this, describing the API routes (`POST /api/links`, `GET /api/links?email=`, `DELETE /api/links/:code`, `GET /:code` redirect, etc.).
