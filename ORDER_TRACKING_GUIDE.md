# Order Tracking System Guide

**Complete documentation for the order tracking and follow-up system on Fanovaly. This guide explains how users can track their orders, view order details, monitor delivery progress, and see real-time SMM status.**

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Orders List Page](#orders-list-page)
5. [Orders-by-Email API](#orders-by-email-api)
6. [Order Detail Page](#order-detail-page)
7. [Order Detail API](#order-detail-api)
8. [Status Mapping & Aggregation](#status-mapping--aggregation)
9. [BulkFollows Integration](#bulkfollows-integration)
10. [Follower Evolution Tracking](#follower-evolution-tracking)
11. [Per-Service Status Tracking](#per-service-status-tracking)
12. [Platform-Specific Styling](#platform-specific-styling)
13. [Internationalization](#internationalization)
14. [Error Handling](#error-handling)
15. [Best Practices](#best-practices)

---

## Overview

The order tracking system allows customers to:
- Search for their orders using their email address
- View a list of all their orders with status summary
- Access detailed order information including delivery progress
- Monitor real-time SMM (Social Media Marketing) order status
- Track follower evolution (before/after comparison)
- View per-service delivery progress

### Key Features
- **Email-based order lookup** - Customers enter their email to retrieve all orders
- **Real-time status updates** - Live BulkFollows API integration for delivery status
- **Visual timeline** - Step-by-step progress indicator (pending → paid → processing → delivered)
- **Follower evolution** - Before/after comparison with live scraper integration
- **Per-service tracking** - Individual status for each service in the cart
- **Platform-specific theming** - Dynamic colors based on social media platform
- **Multi-language support** - French, English, Spanish, Portuguese, German

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /orders (List Page)           /order/[id] (Detail Page)       │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ Email Input      │        │ Status Timeline  │             │
│  │ ↓                │        │ Follower Evolution│             │
│  │ Orders List      │        │ Per-Service Status│             │
│  └──────────────────┘        └──────────────────┘             │
│           │                              │                    │
│           │                              │                    │
└───────────┼──────────────────────────────┼────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/orders-by-email    GET /api/order/[id]              │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ Validate Email   │        │ Fetch Order       │             │
│  │ Query DB         │        │ BulkFollows API   │             │
│  │ Return Orders    │        │ Aggregate Status  │             │
│  └──────────────────┘        └──────────────────┘             │
│           │                              │                    │
│           │                              │                    │
└───────────┼──────────────────────────────┼────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Sources                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL Database          BulkFollows API                   │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ orders table     │        │ Order Status     │             │
│  │ smm_orders JSONB │        │ Per-Service      │             │
│  │ followers_before │        │ Delivery Progress │             │
│  └──────────────────┘        └──────────────────┘             │
│                                                                 │
│  Scrapers (Instagram, TikTok) - Live follower count             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(255),
  email VARCHAR(255),
  username VARCHAR(100) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  cart JSONB NOT NULL,
  post_assignments JSONB,
  total_cents INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  followers_before INTEGER DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  cost_cents INTEGER DEFAULT 0,
  smm_orders JSONB,
  currency VARCHAR(10) DEFAULT 'eur',
  country VARCHAR(10),
  lang VARCHAR(10),
  variant VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key, used in order detail URL |
| `email` | VARCHAR(255) | Customer email for order lookup |
| `username` | VARCHAR(100) | Social media username |
| `platform` | VARCHAR(20) | Platform: tiktok, instagram, youtube, x, twitch, spotify |
| `cart` | JSONB | Array of cart items: `[{ service, label, qty, price, ... }]` |
| `post_assignments` | JSONB | Array of post URLs for likes/views services |
| `total_cents` | INTEGER | Total amount in cents |
| `status` | VARCHAR(20) | Order status: pending, paid, processing, delivered |
| `followers_before` | INTEGER | Follower count before order (for evolution tracking) |
| `delivered_at` | TIMESTAMPTZ | Timestamp when order was marked delivered |
| `cost_cents` | INTEGER | Actual cost from BulkFollows (for profit calculation) |
| `smm_orders` | JSONB | Array of SMM sub-orders with BulkFollows responses |
| `currency` | VARCHAR(10) | Order currency: eur, usd, gbp, cad, nzd |
| `country` | VARCHAR(10) | Customer country (for analytics) |
| `lang` | VARCHAR(10) | Customer language (fr, en, es, pt, de) |
| `variant` | VARCHAR(10) | A/B test variant (A or B) |
| `created_at` | TIMESTAMPTZ | Order creation timestamp |

### smm_orders JSONB Structure

```json
[
  {
    "service": "followers",
    "qty": 1000,
    "bulkfollows_order_id": 123456,
    "charge": 5.50,
    "error": null,
    "link": "https://tiktok.com/@username"
  }
]
```

---

## Orders List Page

### Location
`/orders` → `src/app/orders/page.tsx`

### Purpose
Allows customers to search for all their orders by entering their email address.

### User Flow
1. Customer navigates to `/orders`
2. Enters their email address in the input field
3. Clicks "Search" button (or presses Enter)
4. System fetches all orders associated with that email
5. Displays list of orders with summary information
6. Customer can click on any order to view details

### UI Components

#### Email Input Form
```typescript
<form onSubmit={handleSubmit}>
  <input
    type="email"
    placeholder="ton@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <button type="submit" disabled={!emailValid || loading}>
    {loading ? "..." : t("orders.search")}
  </button>
</form>
```

**Validation:**
- Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Button disabled if email invalid or loading

#### Order Card
Each order is displayed as a clickable card:

```typescript
{
  username: string;
  platform: string;
  cart: { service: string; label: string; qty: number; price: number }[];
  total_cents: number;
  status: string;
  followers_before: number;
  created_at: string;
  delivered_at: string | null;
  currency?: string;
}
```

**Displayed Information:**
- Username with platform badge
- Order status (pending/paid/processing/delivered)
- Cart items (formatted quantity + label)
- Total price (formatted by currency)
- Order date

**Status Colors:**
```typescript
const STATUS_MAP = {
  pending: { label: "En attente", color: "rgb(169,181,174)" },
  paid: { label: "Payé", color: "#ffb800" },
  processing: { label: "En cours", color: "rgb(0,210,106)" },
  delivered: { label: "Livré", color: "rgb(0,255,76)" },
};
```

**Platform Badge Styling:**
- TikTok: Black background, white text
- Instagram: Pink gradient, white text
- YouTube: Red gradient, white text
- X: Blue gradient, white text
- Twitch: Purple gradient, white text
- Spotify: Green gradient, black text

### Empty States

#### No Orders Found
```
📭
Aucune commande trouvée
Vérifiez votre adresse email
```

#### Loading State
Spinner animation while fetching orders.

---

## Orders-by-Email API

### Location
`POST /api/orders-by-email` → `src/app/api/orders-by-email/route.ts`

### Purpose
Fetches all orders associated with a given email address from the database.

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "customer@example.com"
}
```

### Validation

```typescript
if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return NextResponse.json({ error: "Email invalide" }, { status: 400 });
}
```

### Database Query

```sql
SELECT 
  id, 
  username, 
  platform, 
  cart, 
  total_cents, 
  status, 
  followers_before, 
  created_at, 
  delivered_at, 
  COALESCE(currency, 'eur') as currency
FROM orders
WHERE LOWER(email) = ${email.toLowerCase().trim()}
ORDER BY created_at DESC
```

**Notes:**
- Email is case-insensitive (LOWER() + trim)
- Orders sorted by creation date (newest first)
- Currency defaults to 'eur' if NULL

### Response

**Success (200):**
```json
{
  "orders": [
    {
      "id": 123,
      "username": "cristiano",
      "platform": "tiktok",
      "cart": [
        { "service": "followers", "label": "Followers", "qty": 1000, "price": 19.90 }
      ],
      "total_cents": 1990,
      "status": "processing",
      "followers_before": 15800000,
      "created_at": "2024-01-15T10:00:00Z",
      "delivered_at": null,
      "currency": "eur"
    }
  ]
}
```

**Error (400):**
```json
{
  "error": "Email invalide"
}
```

**Error (500):**
```json
{
  "error": "Erreur serveur"
}
```

---

## Order Detail Page

### Location
`/order/[id]` → `src/app/order/[id]/page.tsx`

### Purpose
Displays comprehensive order information including:
- Status timeline with progress indicator
- Follower evolution (before/after comparison)
- Per-service delivery status with progress bars
- Cart items breakdown
- Order total and date
- Call-to-action to relaunch boost

### User Flow
1. Customer clicks on an order from the orders list
2. Page fetches order details from API
3. Displays comprehensive order information
4. Live follower count is scraped (Instagram/TikTok only)
5. BulkFollows status is fetched for each sub-order
6. Customer can track delivery progress in real-time

### UI Components

#### Status Timeline

**4 Steps:**
1. **Pending** (En attente) - Order received
2. **Paid** (Payé) - Payment confirmed
3. **Processing** (En cours) - SMM orders in progress
4. **Delivered** (Livré) - All services delivered

**Visual Implementation:**
- Horizontal progress line
- Circular step indicators
- Active steps are green
- Current step has glow effect
- Timestamps displayed below each step

**Step Determination:**
```typescript
const stepIndex = getStepIndex(order.status);

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 1;
}
```

**Timestamps:**
- Pending/Paid: `order.createdAt`
- Processing: Approximated from `order.createdAt`
- Delivered: `order.delivered_at` (if set)

#### Follower Evolution Card

**Displayed when `followers_before > 0`:**

**Components:**
- **Before:** Follower count at order time
- **After:** Live follower count (scraped from Instagram/TikTok)
- **Gain:** Difference (after - before)
- **Gain %:** Percentage increase

**Live Scraping:**
```typescript
const endpoint = order.platform === "instagram"
  ? `/api/scraper-instagram?username=${encodeURIComponent(order.username)}`
  : `/api/scraper-tiktok?username=${encodeURIComponent(order.username)}`;

fetch(endpoint)
  .then((r) => r.json())
  .then((data) => {
    if (data.followersCount !== undefined) {
      setFollowersNow(data.followersCount);
    }
  });
```

**Supported Platforms:**
- Instagram ✅
- TikTok ✅
- YouTube ❌ (not scraped)
- X ❌ (not scraped)
- Twitch ❌ (not scraped)
- Spotify ❌ (not applicable)

**Gain Calculation:**
```typescript
const gain = followersNow - order.followers_before;
const gainPercent = (gain / order.followersBefore) * 100;
```

#### Per-Service Status Card

**Displayed when `smmStatuses` array exists and has items:**

**Components:**
- Service name with quantity
- Status label (delivered/processing/error/paid)
- Progress bar (0-100%)
- Delivered count / Total count

**Status Colors:**
- Delivered: Green (#22c55e)
- Processing: Amber (#f59e0b)
- Error/Cancelled: Red (#ef4444)
- Paid/Pending: Platform accent color

**Progress Calculation:**
```typescript
const delivered = ss.remains !== undefined 
  ? ss.qty - ss.remains 
  : (ss.status === "delivered" ? ss.qty : 0);
const pct = ss.qty > 0 
  ? Math.min(100, Math.round((delivered / ss.qty) * 100)) 
  : 0;
```

**Remains Field:**
- `remains` comes from BulkFollows API
- Represents quantity still pending
- Used to calculate delivery progress

#### Cart Recap Card

**Components:**
- List of all cart items
- Quantity + label
- Price per item
- Live start time (for Twitch live viewers)
- Total price
- Order date

**Live Start Time Display:**
```typescript
{item.liveStartAt && (
  <p>
    🔴 Live starts: {new Date(item.liveStartAt).toLocaleString(...)}
  </p>
)}
```

#### Call-to-Action

**Buttons:**
1. **"Relancer ce boost"** - Returns to homepage with reset
2. **"Voir toutes mes commandes"** - Returns to orders list

### Platform-Specific Theming

Each platform has unique colors:

```typescript
const PLATFORM_COLORS = {
  youtube:   { accent: "rgb(255,0,0)",     dim: "rgb(204,0,0)",     ... },
  instagram: { accent: "#E1306C",          dim: "#C1358C",          ... },
  tiktok:    { accent: "rgb(105,201,208)", dim: "rgb(79,179,186)",  ... },
  x:         { accent: "#1D9BF0",          dim: "#1A8CD8",          ... },
  twitch:    { accent: "rgb(145,71,255)",  dim: "rgb(110,50,200)",  ... },
  spotify:   { accent: "rgb(29,185,84)",   dim: "rgb(22,140,63)",   ... },
};
```

**Used for:**
- Status timeline colors
- Platform badges
- Price display
- Buttons and links
- Progress bars
- Glow effects

### Loading States

#### Initial Load
Spinner animation while fetching order details.

#### Follower Scraping
Spinner animation while scraping live follower count.

### Error States

#### Order Not Found
```
😕
Commande introuvable
Retour à l'accueil
```

#### Load Error
```
😕
Erreur lors du chargement
Retour à l'accueil
```

---

## Order Detail API

### Location
`GET /api/order/[id]` → `src/app/api/order/[id]/route.ts`

### Purpose
Fetches detailed order information and live BulkFollows status for each sub-order.

### Request

**Method:** `GET`

**URL Parameter:**
- `id` - Order ID (number)

### Validation

```typescript
const orderId = Number(id);
if (!orderId || isNaN(orderId)) {
  return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
}
```

### Database Query

```typescript
const order = await getOrderById(orderId);
if (!order) {
  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
```

### BulkFollows Status Fetching

**Process:**
1. Extract `smm_orders` array from order
2. For each sub-order with `bulkfollows_order_id`:
   - Call `getSmmStatus(bulkfollows_order_id)` from BulkFollows API
   - Map BulkFollows status to simplified status
   - Extract `remains` field for progress calculation
3. Aggregate all sub-order statuses into overall order status

**Parallel Execution:**
```typescript
await Promise.all(
  smmOrders.map(async (so) => {
    if (!so.bulkfollows_order_id) {
      smmStatuses.push({ 
        service: so.service, 
        qty: so.qty, 
        status: so.error ? "error" : "pending" 
      });
      return;
    }
    try {
      const st = await getSmmStatus(so.bulkfollows_order_id);
      smmStatuses.push({
        service: so.service,
        qty: so.qty,
        status: mapBfStatus(st.status),
        remains: st.remains ? parseInt(st.remains, 10) : undefined,
      });
    } catch {
      smmStatuses.push({ 
        service: so.service, 
        qty: so.qty, 
        status: "pending" 
      });
    }
  })
);
```

### Status Mapping

**BulkFollows → Simplified Status:**

```typescript
function mapBfStatus(s: string | undefined): string {
  if (!s) return "pending";
  const lower = s.toLowerCase();
  if (lower === "completed") return "delivered";
  if (lower === "partial") return "delivered";
  if (lower === "in progress" || lower === "inprogress") return "processing";
  if (lower === "processing") return "processing";
  if (lower === "pending") return "paid";
  if (lower === "canceled" || lower === "cancelled") return "cancelled";
  return "processing";
}
```

**Mapping Table:**

| BulkFollows Status | Simplified Status |
|-------------------|-------------------|
| completed | delivered |
| partial | delivered |
| in progress / inprogress | processing |
| processing | processing |
| pending | paid |
| canceled / cancelled | cancelled |
| (other) | processing |

### Status Aggregation

**Overall Status Determination:**

```typescript
function aggregateStatus(statuses: string[]): string {
  if (statuses.length === 0) return "paid";
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "cancelled")) return "processing"; // partial issue
  if (statuses.some((s) => s === "processing")) return "processing";
  return "paid";
}
```

**Logic:**
- No sub-orders: `paid`
- All delivered: `delivered`
- Any cancelled: `processing` (partial issue)
- Any processing: `processing`
- Otherwise: `paid`

### Response

**Success (200):**
```json
{
  "id": 123,
  "username": "cristiano",
  "platform": "tiktok",
  "cart": [
    { "service": "followers", "label": "Followers", "qty": 1000, "price": 19.90 }
  ],
  "totalCents": 1990,
  "status": "processing",
  "smmStatuses": [
    {
      "service": "followers",
      "qty": 1000,
      "status": "processing",
      "remains": 500
    }
  ],
  "followersBefore": 15800000,
  "createdAt": "2024-01-15T10:00:00Z",
  "deliveredAt": null,
  "currency": "eur"
}
```

**Error (400):**
```json
{
  "error": "Invalid order ID"
}
```

**Error (404):**
```json
{
  "error": "Order not found"
}
```

---

## Status Mapping & Aggregation

### Order Status Flow

```
pending → paid → processing → delivered
```

### Status Transitions

| From | To | Trigger |
|------|-----|---------|
| pending | paid | Stripe payment confirmed |
| paid | processing | SMM orders placed with BulkFollows |
| processing | delivered | All SMM sub-orders completed |
| any | cancelled | Manual admin action (not shown in UI) |

### BulkFollows Status Lifecycle

```
pending → in progress → completed
                    ↓
                  partial
```

### Aggregation Rules

**When multiple sub-orders exist:**

| Sub-order Statuses | Aggregate Status |
|-------------------|------------------|
| All delivered | delivered |
| Any processing | processing |
| Any cancelled | processing (partial issue) |
| All paid | paid |
| No sub-orders | paid |

---

## BulkFollows Integration

### API Client

**Location:** `src/lib/bulkfollows.ts`

**Functions:**
- `placeOrder(serviceId, link, quantity)` - Place new order
- `getOrderStatus(orderId)` - Get order status
- `getBalance()` - Get account balance
- `getServices()` - Get available services

### Order Placement

**Called from:** `/api/confirm-order/route.ts`

**Process:**
1. Check `auto_order_enabled` setting
2. Fetch `smm_config` mappings
3. Build profile link and post URLs
4. For each cart item:
   - Get BulkFollows service ID from mapping
   - Determine link (profile or post URL)
   - Call `placeOrder(serviceId, link, qty)`
   - Wait 1 second
   - Call `getOrderStatus(orderId)` to get charge
   - Store result in `smm_orders` array
5. Update order with `smm_orders` and `cost_cents`

### Status Polling

**Called from:** `/api/order/[id]/route.ts`

**Process:**
1. Fetch order from database
2. Extract `smm_orders` array
3. For each sub-order:
   - Call `getOrderStatus(bulkfollows_order_id)`
   - Map status to simplified status
   - Extract `remains` field
4. Aggregate statuses
5. Return live status to frontend

### Rate Limiting

**Current Implementation:**
- 1 second delay between order placement and status check
- No explicit rate limiting on status polling
- Each order detail page load triggers BulkFollows API calls

**Recommendations:**
- Implement caching for status (30-60 seconds)
- Limit concurrent status checks
- Consider WebSocket for real-time updates

---

## Follower Evolution Tracking

### Purpose

Show customers the growth in followers before and after the order.

### Data Points

- **Before:** Stored in `orders.followers_before` at order time
- **After:** Scraped live from Instagram/TikTok API

### Scraping Endpoints

**Instagram:**
```
GET /api/scraper-instagram?username={username}
```

**TikTok:**
```
GET /api/scraper-tiktok?username={username}
```

### Supported Platforms

| Platform | Scraped | Notes |
|----------|---------|-------|
| Instagram | ✅ | Profile API provides follower count |
| TikTok | ✅ | Profile API provides follower count |
| YouTube | ❌ | Channel API provides subscriber count (not implemented) |
| X | ❌ | Profile API provides follower count (not implemented) |
| Twitch | ❌ | Channel API does NOT provide follower count |
| Spotify | ❌ | Not applicable (track search, not profile) |

### Gain Calculation

```typescript
const gain = followersNow - followersBefore;
const gainPercent = (gain / followersBefore) * 100;
```

**Display Format:**
```
+1.5K followers (+10.2%)
```

### Edge Cases

**When `followers_before = 0`:**
- Gain calculation skipped
- "Before" card not displayed

**When scraper fails:**
- Display "—" for current count
- No error message shown to user

**When scraper times out:**
- Display "—" for current count
- No retry attempted

---

## Per-Service Status Tracking

### Purpose

Show individual delivery progress for each service in the cart.

### Data Structure

**From API:**
```typescript
{
  service: string;
  qty: number;
  status: string;
  remains?: number;
}
```

### Status Display

**Progress Bar:**
- Width: `(delivered / qty) * 100%`
- Color: Based on status (green/amber/red/platform accent)
- Smooth transition animation

**Delivered Count Calculation:**
```typescript
const delivered = remains !== undefined 
  ? qty - remains 
  : (status === "delivered" ? qty : 0);
```

**Text Display:**
```
500/1K (50%)
```

### Status Labels

| Status | Label (French) | Color |
|--------|----------------|-------|
| delivered | Livré | Green |
| processing | En cours | Amber |
| error | Erreur | Red |
| cancelled | Annulé | Red |
| paid | Payé | Platform accent |
| pending | En attente | Platform accent |

### Remains Field

**Source:** BulkFollows API response

**Meaning:** Quantity still pending delivery

**Example:**
- Ordered: 1,000 followers
- Delivered: 500
- Remains: 500

**Fallback:**
- If `remains` not provided:
  - If status is "delivered": delivered = qty
  - Otherwise: delivered = 0

---

## Platform-Specific Styling

### Color Schemes

**YouTube:**
- Accent: `rgb(255,0,0)`
- Dim: `rgb(204,0,0)`
- Gradient: `linear-gradient(135deg, rgb(153,0,0), rgb(255,0,0))`
- Text on gradient: `#fff`
- Glow: `rgba(255,0,0,0.25)`

**Instagram:**
- Accent: `#E1306C`
- Dim: `#C1358C`
- Gradient: `linear-gradient(135deg, #833AB4, #E1306C, #F77737)`
- Text on gradient: `#fff`
- Glow: `rgba(225,48,108,0.25)`

**TikTok:**
- Accent: `rgb(105,201,208)`
- Dim: `rgb(79,179,186)`
- Gradient: `linear-gradient(135deg, rgb(79,179,186), rgb(105,201,208))`
- Text on gradient: `#000`
- Glow: `rgba(105,201,208,0.25)`

**X (Twitter):**
- Accent: `#1D9BF0`
- Dim: `#1A8CD8`
- Gradient: `linear-gradient(135deg, #1A8CD8, #1D9BF0)`
- Text on gradient: `#fff`
- Glow: `rgba(29,155,240,0.25)`

**Twitch:**
- Accent: `rgb(145,71,255)`
- Dim: `rgb(110,50,200)`
- Gradient: `linear-gradient(135deg, rgb(110,50,200), rgb(145,71,255))`
- Text on gradient: `#fff`
- Glow: `rgba(145,71,255,0.25)`

**Spotify:**
- Accent: `rgb(29,185,84)`
- Dim: `rgb(22,140,63)`
- Gradient: `linear-gradient(135deg, rgb(22,140,63), rgb(30,215,96))`
- Text on gradient: `#000`
- Glow: `rgba(29,185,84,0.25)`

### Usage

**Applied to:**
- Status timeline indicators
- Platform badges
- Price text
- Call-to-action buttons
- Progress bars (when active)
- Glow effects
- Links

### Fallback

Default to TikTok colors if platform not recognized.

---

## Internationalization

### Supported Languages

- French (fr) - Default
- English (en)
- Spanish (es)
- Portuguese (pt)
- German (de)

### Translation Keys

**Orders Page:**
- `orders.subtitle` - Page subtitle
- `orders.emailLabel` - Email input label
- `orders.search` - Search button
- `orders.serverError` - Server error message
- `orders.noOrders` - No orders found
- `orders.checkEmail` - Check email hint
- `orders.found` - "commande trouvée"
- `orders.foundPlural` - "commandes trouvées"
- `orders.foundSuffix` - "pour cette adresse"
- `orders.foundPluralSuffix` - "pour cette adresse"
- `orders.backHome` - Back to home link

**Order Detail Page:**
- `orderDetail.tracking` - "Suivi de commande"
- `orderStatus.pending` - "En attente"
- `orderStatus.paid` - "Payé"
- `orderStatus.processing` - "En cours"
- `orderStatus.delivered` - "Livré"
- `orderStatus.error` - "Erreur"
- `orderDetail.statusDelivered` - "Commande livrée avec succès"
- `orderDetail.statusProcessing` - "Livraison en cours"
- `orderDetail.statusPaid` - "Commande payée, en attente de livraison"
- `orderDetail.statusPending` - "Commande en attente"
- `orderDetail.deliveredOn` - "Livré le"
- `orderDetail.evolution` - "Évolution des followers"
- `orderDetail.before` - "Avant"
- `orderDetail.now` - "Maintenant"
- `orderDetail.followers` - "followers"
- `orderDetail.serviceStatus` - "Statut par service"
- `orderDetail.orderDetail` - "Détail de la commande"
- `orderDetail.orderedOn` - "Commandé le"
- `orderDetail.relaunchBoost` - "Relancer ce boost"
- `orderDetail.loadError` - "Erreur lors du chargement"

**Live (Twitch):**
- `live.liveStarts` - "Live starts"

### Date Formatting

**Locale Mapping:**
```typescript
const LANG_LOCALE = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  pt: "pt-PT",
  de: "de-DE",
};
```

**Format Examples:**
```typescript
// Short date
new Date(date).toLocaleDateString(LANG_LOCALE[lang], { 
  day: "numeric", 
  month: "short", 
  year: "numeric" 
});
// Output: "15 jan. 2024"

// Full date with time
new Date(date).toLocaleDateString(LANG_LOCALE[lang], { 
  weekday: "long", 
  day: "numeric", 
  month: "long", 
  hour: "2-digit", 
  minute: "2-digit" 
});
// Output: "lundi 15 janvier 2024 à 10:00"

// Time only
new Date(date).toLocaleString(LANG_LOCALE[lang], { 
  day: "numeric", 
  month: "short", 
  hour: "2-digit", 
  minute: "2-digit" 
});
// Output: "15 jan. 2024 à 10:00"
```

### Currency Formatting

**Function:** `fmtPrice(amount, currency)`

**Supported Currencies:**
- EUR (€)
- USD ($)
- GBP (£)
- CAD (CA$)
- NZD (NZ$)

**Example:**
```typescript
fmtPrice(19.90, "eur"); // "19,90 €"
fmtPrice(19.90, "usd"); // "$19.90"
```

---

## Error Handling

### Orders List Page

**Email Validation Error:**
- Display error message below input
- Button remains disabled
- No API call made

**API Error:**
- Display "Erreur serveur" message
- No orders shown
- User can retry with different email

### Order Detail Page

**Order Not Found (404):**
- Display emoji 😕
- Show error message
- Provide "Retour à l'accueil" link
- No retry mechanism

**Load Error:**
- Display emoji 😕
- Show "Erreur lors du chargement" message
- Provide "Retour à l'accueil" link
- No retry mechanism

**Scraping Error (Follower Count):**
- Silent failure
- Display "—" for current count
- No error message shown to user
- Evolution card still displayed with "After" = "—"

**BulkFollows API Error:**
- Sub-order status set to "pending"
- No error shown for individual service
- Overall status may not update correctly
- Manual admin intervention may be required

### API Routes

**Orders-by-Email:**
- 400: Invalid email format
- 500: Database error

**Order Detail:**
- 400: Invalid order ID
- 404: Order not found
- 500: Database or BulkFollows error

### Error Recovery

**Client-Side:**
- User can retry by reloading page
- User can enter different email on orders list
- User can navigate to home and start over

**Server-Side:**
- No automatic retry for failed API calls
- BulkFollows errors logged to console
- Database errors logged to console
- No alerting/monitoring implemented

---

## Best Practices

### 1. Email Validation

Always validate email format before API call:
```typescript
const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

### 2. Case-Insensitive Email Lookup

Use `LOWER()` and `trim()` for email matching:
```sql
WHERE LOWER(email) = ${email.toLowerCase().trim()}
```

### 3. Parallel BulkFollows Status Fetching

Use `Promise.all()` for concurrent status checks:
```typescript
await Promise.all(
  smmOrders.map(async (so) => {
    // fetch status
  })
);
```

### 4. Status Mapping

Always map BulkFollows statuses to simplified statuses:
```typescript
function mapBfStatus(s: string | undefined): string {
  // mapping logic
}
```

### 5. Error Boundaries

Wrap API calls in try-catch:
```typescript
try {
  const st = await getSmmStatus(orderId);
} catch {
  smmStatuses.push({ service, qty, status: "pending" });
}
```

### 6. Loading States

Show loading indicators for all async operations:
- Initial order fetch
- Follower scraping
- BulkFollows status polling

### 7. Graceful Degradation

If scraper fails, show placeholder instead of error:
```typescript
{followersNow !== null ? (
  <p>{fmtQty(followersNow)}</p>
) : (
  <p>—</p>
)}
```

### 8. Currency Default

Always default to EUR if currency is NULL:
```sql
COALESCE(currency, 'eur') as currency
```

### 9. Platform Fallback

Default to TikTok colors if platform not recognized:
```typescript
const pc = PLATFORM_COLORS[platform] || PLATFORM_COLORS.tiktok;
```

### 10. Timestamp Fallback

Handle missing timestamps gracefully:
```typescript
const stepTimestamps = [
  order.createdAt ? fmtTime(order.createdAt) : null,
  order.deliveredAt ? fmtTime(order.deliveredAt) : null,
];
```

### 11. Progress Calculation

Use `remains` field when available for accurate progress:
```typescript
const delivered = remains !== undefined 
  ? qty - remains 
  : (status === "delivered" ? qty : 0);
```

### 12. Quantity Formatting

Use `fmtQty()` for human-readable numbers:
```typescript
function fmtQty(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000) + "K";
  return String(n);
}
```

### 13. Suspense for Dynamic Routes

Use `Suspense` for dynamic route params:
```typescript
export default function OrderPage({ params }) {
  return (
    <Suspense>
      <OrderPageInner params={params} />
    </Suspense>
  );
}
```

### 14. Environment Variable Check

Check for `BULKFOLLOWS_API_KEY` before making API calls:
```typescript
if (smmOrders.length > 0 && process.env.BULKFOLLOWS_API_KEY) {
  // fetch status
}
```

### 15. Aggregation Logic

Implement clear aggregation rules for overall status:
```typescript
function aggregateStatus(statuses: string[]): string {
  if (statuses.length === 0) return "paid";
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "cancelled")) return "processing";
  if (statuses.some((s) => s === "processing")) return "processing";
  return "paid";
}
```

---

## Summary

This guide provides a comprehensive overview of the order tracking system on Fanovaly:

- ✅ Orders list page with email-based lookup
- ✅ Order detail page with comprehensive information
- ✅ Real-time BulkFollows status integration
- ✅ Follower evolution tracking (Instagram/TikTok)
- ✅ Per-service delivery progress
- ✅ Platform-specific theming
- ✅ Multi-language support
- ✅ Status mapping and aggregation
- ✅ Error handling and graceful degradation

**Key Components:**
1. `/orders` - Order list page
2. `/order/[id]` - Order detail page
3. `/api/orders-by-email` - Orders lookup API
4. `/api/order/[id]` - Order detail API with live status

**Key Integrations:**
- PostgreSQL database for order storage
- BulkFollows API for SMM order status
- Instagram/TikTok scrapers for follower count
- Stripe for payment confirmation (separate flow)

**Data Flow:**
```
Customer Email → Orders List → Order Detail → 
  DB Query + BulkFollows API + Scrapers → 
  Real-time Status Display
```

---

**Last Updated:** 2026  
**Documentation Purpose:** Order tracking system understanding for AI and developers
