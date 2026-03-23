# BeanCraft

A full-stack **coffee shop** web app: browse categories, build a cart, check out as a signed-in customer, and run day-to-day operations from an **admin** area. Built as a **MERN** monorepo (MongoDB, Express, React, Node).

## Live at

_Add your deployed site URL here._

---

## Features

### Storefront & menu

- **Home** with hero, category cards, **best sellers**, and **recent customer reviews** (verified-style testimonials).
- **Category menus** (e.g. coffees, sweets, specials) plus **dynamic routes** by category slug for admin-created categories.
- **Product cards** with images, price, **stock status** (in stock / out of stock), and **live ratings** (average + review count).
- **Shopping cart** with quantity controls, subtotal, optional GST-style fee on smaller totals, and **payment method** selection at checkout.
- **Order confirmation** screen with order summary; reviews are prompted **after delivery** on the profile (not at checkout).

### Accounts & profile

- **Sign up** and **login** with JWT-backed sessions (token + user stored client-side).
- **Profile** shows account details and **full order history** (newest first).
- Customers can **cancel** orders only while they are **pending** and **not yet accepted** by the shop.
- After the shop **accepts** an order, cancellation from the profile is **disabled** and a clear status message is shown.
- **Delivered** orders show a **delivered** badge, delivery timestamp when available, and a dedicated flow to **rate each line item** (stars + optional comment). One review per product per user; duplicates are rejected server-side.
- **Remind me later** on the review panel **snoozes by order ID** so **new** delivered orders still surface for review later in the same session.

### Admin

- **Separate admin navigation** (dashboard vs **orders** page) so catalog work and order operations stay organized.
- **Dashboard**: CRUD for **categories** (name, slug, description, image) and **products** (name, price, category, image, stock flag); **catalog grid** with inline edit/delete; **customer reviews** list with delete and automatic product rating recalculation.
- **Orders page**: list all non-hidden orders with customer info, line items, payment method, and status.
- **Accept order** — locks the order from customer-side cancellation while keeping it in the pipeline.
- **Mark delivered** — sets fulfilled status and **delivered** timestamp; customer profile and review prompts update accordingly.
- **Remove** — hides an order from the admin list (with shop-cancel semantics where applicable); **delivered orders cannot be removed** (enforced in API and UI).
- **Live updates** on key views: periodic refresh and **visibility-based refetch** so admins and customers see status changes without a full manual reload.

### UX & polish

- **Responsive layout** including admin order action buttons that **stack cleanly on small screens** (no overlap with customer name).
- **Client-side routing** with scroll-to-section support on the home page.
- **Admin users** are routed to the admin area; **CORS** configured for development and production front-end origins.

---

## Technologies used

| Area | Technology | Role |
| ---- | ---------- | ---- |
| **UI** | React 19 | Components, hooks, client state |
| **Routing** | React Router 7 | SPA routes, nested admin routes, protected flows |
| **Build** | Vite 8 | Dev server, HMR, production bundle |
| **Styling** | CSS (custom) | Layout, themes, responsive rules |
| **HTTP** | `fetch` (wrapped) | API calls; optional `VITE_API_BASE_URL` for split deploy (e.g. Vercel + API host) |
| **API** | Express 5 | REST JSON API under `/api` |
| **Database** | MongoDB + Mongoose 9 | Persistence, schemas, indexes |
| **Auth** | JWT + bcryptjs | Signup/login, `protect` / `adminOnly` middleware |
| **Tooling** | ESLint (client), Node ESM | Linting; `"type": "module"` on server |
| **Deploy (optional)** | `client/vercel.json` | SPA fallback rewrites for deep links |

---

## Architecture (high level)

```
client/     React SPA (Vite)
server/     Express app: routes → controllers → Mongoose models
            Serves client/dist in production when NODE_ENV=production
```

### Main API surface

- **Auth** — signup, login, `me`
- **Categories** — public list; admin create/update/delete
- **Products** — list/filter, best sellers, single product; admin CRUD
- **Reviews** — by product, recent feed, post review (auth), pending-after-delivery feed (auth), admin list/delete
- **Orders** — create (auth), my orders, all orders (admin), accept / deliver / cancel (owner), admin delete with rules for fulfilled vs other states

### Data model (conceptual)

- **Users** (roles: customer / admin)
- **Categories** & **Products** (with cached `averageRating` / `reviewCount`)
- **Reviews** (user + product + rating + comment)
- **Orders** (items snapshot, payment, status lifecycle, acceptance & delivery timestamps, optional hide-from-admin / cancel metadata)

---

## Repository layout

| Path | Contents |
| ---- | -------- |
| `client/` | Vite + React source, assets, `vercel.json` for static hosting |
| `server/` | Express entrypoint, `config/`, `routes/`, `controllers/`, `models/`, `middleware/`, `scripts/` (e.g. seed, rating recalc) |
| Root `package.json` | Workspace-style scripts that delegate to `client` and `server` |

---

_Environment variables, install steps, and run commands are intentionally omitted here; configure and run the app according to your own deployment or local setup._
