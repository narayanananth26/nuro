


## Project Setup

### Step 1: Initialize Project

-   Initialize a **Next.js App** with **TypeScript**:
    
    ```bash
    npx create-next-app@latest url-health-monitor --typescript
    cd url-health-monitor
    
    ```
    
-   Install dependencies:
    
    ```bash
    npm install tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    
    ```
    
-   Configure `tailwind.config.js` and include Tailwind in `globals.css`.
    
-   Add MongoDB and other essential packages:
    
    ```bash
    npm install mongoose
    npm install node-cron
    npm install json2csv
    npm install chart.js react-chartjs-2
    
    ```

----------

## Feature 1: Guest URL Health Check

### Goal

Allow any user, without requiring authentication, to input a single URL and instantly check whether the site is reachable ("UP") or not ("DOWN"), along with the response time and a timestamp.

----------

### Frontend (UI and Logic) - Use shadcn/ui

**Page:** `/` (homepage)

**Components:**

-   A user-friendly form that includes:
    
    -   A single text input field for entering a valid URL (e.g., `https://example.com`)
        
    -   A button labeled “Check Now”
        

**Behavior on Submit:**

1.  When the user submits the form:
    
    -   The frontend will send a `POST` request to the backend API route `/api/check-url`.
        
    -   The request body will contain the URL the user entered, in JSON format:
        
        ```json
        { "url": "https://example.com" }
        
        ```
        
2.  While waiting for the response:
    
    -   The UI can show a loading state or spinner.
        
3.  When the response is received:
    
    -   The UI will display the following results in a readable format:
        
        -   **Status:** "UP" or "DOWN"
            
        -   **Response Time:** Time taken in milliseconds (e.g., `120 ms`)
            
        -   **Checked At:** A human-readable timestamp (e.g., `2025-04-10 15:45:12`)
            

**Validation:**

-   Input should be validated on the client side to ensure the URL is not empty and is in a valid format.
    
-   Optionally, display an error message if the input is invalid.
    

----------

### Backend API

**Route:** `/api/check-url`  
**Method:** `POST`  
**Auth:** Not required

```ts
// /api/check-url.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      const responseTime = Date.now() - startTime;
      clearTimeout(timeout);

      return NextResponse.json({
        status: res.ok ? 'UP' : 'DOWN',
        responseTime: `${responseTime} ms`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      clearTimeout(timeout);
      return NextResponse.json({
        status: 'DOWN',
        responseTime: 'N/A',
        timestamp: new Date().toISOString(),
        error: 'Fetch failed or timed out',
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

```

**Explanation of Backend Logic:**

-   Extract the `url` field from the request body.
    
-   If the `url` is invalid or missing, respond with HTTP 400 and an error message.
    
-   Use the native `fetch()` method with an `AbortController` to set a timeout (e.g., 5 seconds).
    
-   Measure the time it takes to receive a response.
    
-   If the fetch succeeds:
    
    -   Return `"UP"` if the response status code is 200–299.
        
    -   Return `"DOWN"` otherwise.
        
    -   Include the response time in milliseconds and the timestamp of the check.
        
-   If the fetch fails (network error, timeout, etc.):
    
    -   Return `"DOWN"` with response time marked as `"N/A"` and include the timestamp.
        

----------

### Expected Response Format (Success):

```json
{
  "status": "UP",
  "responseTime": "132 ms",
  "timestamp": "2025-04-10T12:05:32.512Z"
}

```

### Expected Response Format (Failure):

```json
{
  "status": "DOWN",
  "responseTime": "N/A",
  "timestamp": "2025-04-10T12:06:44.123Z",
  "error": "Fetch failed or timed out"
}

```

----------
## Feature 2: Authentication System

### Goal

Enable user authentication using **NextAuth.js**, allowing users to securely register, log in, and access protected features like saving and monitoring URLs. Logged-in users should see a different interface and have access to a dashboard.

----------

### Technology Stack

-   Use **NextAuth.js** for authentication
    
-   Use **MongoDB** to store user accounts and sessions
    
-   Use **Credentials Provider** (email + password) for custom login/register logic
    
----------

### Folder Structure

Place auth configuration and routes under:

```
/src
  /app
    /api
      /auth
        [...nextauth]/route.ts
    /auth
      /login
      /register

```

----------

### Tasks

#### 1. **Install NextAuth and required packages**

```bash
npm install next-auth bcrypt
```

----------

#### 2. **Configure NextAuth: `/api/auth/[...nextauth]/route.ts`**

```ts
// /src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

```

----------

#### 3. **Define `authOptions`: `/lib/auth.ts`**

```ts
// /src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("No user found");

        const isValid = await bcrypt.compare(credentials!.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return { id: user._id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

```

----------

#### 4. **User Model: `/models/User.ts`**

```ts
// /src/models/User.ts
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);

```

----------

#### 5. **Database Connection Utility: `/lib/dbConnect.ts`**

```ts
// /src/lib/dbConnect.ts
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGO_URI);
};

export default dbConnect;

```

----------

#### 6. **Create Register Page: `/auth/register/page.tsx`**

-   Form with email + password fields
    
-   Hash password using `bcrypt`
    
-   Save new user to MongoDB
    

----------

#### 7. **Create Login Page: `/auth/login/page.tsx`**

-   Use `signIn()` from `next-auth/react` to log in
    
-   On success, redirect to `/dashboard`
    

----------

#### 8. **Protect Routes like `/dashboard`**

Create a middleware (optional) or use `getServerSession` in pages to verify auth:

```ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session) redirect("/auth/login");

```

----------

#### 9. **Update UI Based on Session**

Use the `useSession()` hook from `next-auth/react` to check if a user is logged in and show:

-   "Log in / Register" for guests
    
-   "Dashboard / Log out" for authenticated users
    


----------

## Feature 3: MongoDB Integration + URL Saving

### Goal

Enable authenticated users to save URLs into a MongoDB collection along with a custom monitoring interval. These URLs will later be monitored periodically using background jobs (covered in a future feature). Each URL entry tracks status, last checked time, and a history of logs.

----------

### MongoDB Schema

Create a model named `UrlMonitor`.

```ts
// /src/models/UrlMonitor.ts
import mongoose from "mongoose";

const UrlMonitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  url: {
    type: String,
    required: true,
  },
  interval: {
    type: Number, // in minutes
    required: true,
  },
  lastChecked: {
    type: Date,
    default: null,
  },
  status: {
    type: String, // "UP" or "DOWN"
    default: "UNKNOWN",
  },
  responseTime: {
    type: Number, // in milliseconds
    default: null,
  },
  logs: [
    {
      timestamp: Date,
      status: String, // "UP" or "DOWN"
      responseTime: Number, // ms
    },
  ],
}, {
  timestamps: true,
});

export default mongoose.models.UrlMonitor || mongoose.model("UrlMonitor", UrlMonitorSchema);

```

----------

### Tasks

#### 1. **Create MongoDB Model**

Place model at `/src/models/UrlMonitor.ts` as shown above.

----------

#### 2. **Update URL Input Form**

**On the homepage (for guests)**  
Keep the simple “Check Now” form.

**On the dashboard (for logged-in users)**  
Add a form with:

-   URL input
    
-   Dropdown for monitoring interval (`5 minutes`, `10 minutes`, `30 minutes`, `1 hour`, etc.)
    
-   Submit button labeled **“Save & Monitor”**
    

```ts
<select name="interval">
  <option value="5">Every 5 minutes</option>
  <option value="10">Every 10 minutes</option>
  <option value="30">Every 30 minutes</option>
  <option value="60">Every 1 hour</option>
</select>

```

----------

#### 3. **Create API Route: `/api/monitor/save-url`**

Handle the POST request to save a URL for a logged-in user.

```ts
// /src/app/api/monitor/save-url/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import UrlMonitor from "@/models/UrlMonitor";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, interval } = await req.json();
  if (!url || !interval) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();

  try {
    const monitor = await UrlMonitor.create({
      userId: session.user.id,
      url,
      interval,
    });

    return NextResponse.json({ success: true, monitor });
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

```

----------

#### 4. **Show User Feedback**

On form submission:

-   Show success message: “URL saved and monitoring started.”
    
-   Show error message on failure (e.g., "Failed to save URL. Please try again.")
    

Use a toast notification or a small alert div near the form for feedback.

----------

## Feature 4: Background Monitoring with Cron Jobs

### Goal

Set up a background job that periodically checks the health of saved URLs based on their custom intervals, logs their status and response time, and handles retries on failure with exponential backoff.

----------

### Tools

-   [`node-cron`](https://www.npmjs.com/package/node-cron) — to schedule background jobs.
    
-   `fetch` — to ping URLs.
    
-   MongoDB — to query and update saved URLs and logs.
    

----------

### Tasks Breakdown

#### ✅ 1. **Set up `node-cron` job (runs every minute)**

Create a separate file under `src/lib/monitor.ts` (or `src/jobs/monitor.ts`) to handle the cron logic.

```ts
// /src/lib/monitor.ts
import cron from "node-cron";
import UrlMonitor from "@/models/UrlMonitor";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export function startMonitoringJob() {
  cron.schedule("* * * * *", async () => {
    await dbConnect();
    
    const now = new Date();
    
    // Fetch all monitors due for checking
    const dueMonitors = await UrlMonitor.find({
      $or: [
        { lastChecked: null },
        {
          lastChecked: { $lte: new Date(now.getTime() - 60000) }, // At least 1 minute ago
        },
      ],
    });

    for (const monitor of dueMonitors) {
      const intervalMs = monitor.interval * 60 * 1000;
      const timeSinceLastCheck = now.getTime() - new Date(monitor.lastChecked || 0).getTime();

      if (!monitor.lastChecked || timeSinceLastCheck >= intervalMs) {
        await handlePing(monitor);
      }
    }
  });
}

```

----------

#### 2. **Ping with retry and backoff**

Create a `handlePing` function:

```ts
async function handlePing(monitor: any) {
  const url = monitor.url;
  const retries = [5000, 10000, 20000]; // 5s, 10s, 20s

  const result = await attemptPing(url);
  if (result.success) {
    return logMonitorResult(monitor, "UP", result.responseTime);
  }

  // Retry logic
  for (let i = 0; i < retries.length; i++) {
    await new Promise((res) => setTimeout(res, retries[i]));
    const retryResult = await attemptPing(url);
    if (retryResult.success) {
      return logMonitorResult(monitor, "UP", retryResult.responseTime);
    }
  }

  // All retries failed
  return logMonitorResult(monitor, "DOWN", null);
}

```

----------

#### 3. **Ping attempt function**

```ts
async function attemptPing(url: string): Promise<{ success: boolean; responseTime?: number }> {
  try {
    const start = Date.now();
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const responseTime = Date.now() - start;
    if (!res.ok) throw new Error("Non-200");
    return { success: true, responseTime };
  } catch {
    return { success: false };
  }
}

```

----------

#### 4. **Log results into MongoDB**

Append new entry to `logs[]`, and update `lastChecked`, `status`, and `responseTime`.

```ts
async function logMonitorResult(monitor: any, status: "UP" | "DOWN", responseTime: number | null) {
  const now = new Date();

  monitor.logs.push({
    timestamp: now,
    status,
    responseTime: responseTime || 0,
  });

  monitor.status = status;
  monitor.responseTime = responseTime || null;
  monitor.lastChecked = now;

  await monitor.save();
}

```

----------

### Optional: Alternate Log Storage

Instead of nesting logs in `logs[]`, create a new collection `MonitorLog`:

```ts
{
  monitorId,
  timestamp,
  status,
  responseTime
}

```

But for simplicity and performance, nested logs should be enough unless there's high volume.

----------

### Integration in App

Import and call `startMonitoringJob()` once during server boot (e.g., in `middleware.ts`, `server.ts`, or a top-level server layout file like `src/app/layout.tsx`).

```ts
// Call it once in a backend-only context
import { startMonitoringJob } from "@/lib/monitor";
startMonitoringJob();

```
----------


## Feature 5: Dashboard for Logged-in Users

### **Goal**

Provide logged-in users with a clean, actionable dashboard displaying all their monitored URLs along with their current status, metrics, and options to filter or manage them.

----------

### **Route**

-   `/dashboard` – Accessible only to authenticated users.
    
-   Protected using NextAuth middleware or server-side session check.
    

----------

### **Tasks Breakdown**

#### 1. **Page Setup: `/dashboard`**

-   Create a `page.tsx` under `src/app/dashboard/`.
    
-   Ensure the page checks user authentication:
    
    -   Use `getServerSession()` from `next-auth` for server-side protection.
        
    -   Redirect unauthenticated users to `/login`.
        

#### 2. **Fetch Data**

Use one of the following approaches:

-   **SWR** (client-side fetching with revalidation):
    
    -   Endpoint: `/api/user/monitors` (returns user’s saved monitors).
        
    -   Auto-refresh every 60s to reflect updated checks.
        
-   **getServerSideProps** or **server component**:
    
    -   Fetch data before rendering if SEO/performance is important.
        

----------

#### 3. **Table Columns**

URL

Status

Last Checked

Response Time

Interval

Actions

`https://...`

UP/DOWN

`2 minutes ago`

`120ms`

`10m`

Edit / Delete

-   Use a UI component library like `shadcn/ui`, Tailwind, or simple table markup.
    
-   Status should be conditionally styled:
    
    -   UP → green badge
        
    -   DOWN → red badge
        
-   Timestamps can be relative (`x minutes ago`) using `date-fns` or `moment`.
    

----------

#### 4. **Filters**

Add a filter bar above the table:

-   Dropdown or tab controls:
    
    -   **All**
        
    -   **Only UP**
        
    -   **Only DOWN**
        
-   Apply filtering either client-side (for small datasets) or server-side with query params.
    

----------

#### 5. **Actions: Edit / Delete**

##### Edit:

-   Open modal or inline form to update:
    
    -   URL
        
    -   Monitoring Interval
        
-   On submit, send PUT request to `/api/user/monitors/[id]`.
    
-   Validate and update DB.
    

##### Delete:

-   Trigger confirmation prompt.
    
-   On confirm, send DELETE request to `/api/user/monitors/[id]`.
    
-   Remove from list without page reload (optimistic update using SWR or local state).
    

----------

### Suggested API Routes

1.  `GET /api/user/monitors` – Get all monitors for logged-in user.
    
2.  `PUT /api/user/monitors/:id` – Update URL or interval.
    
3.  `DELETE /api/user/monitors/:id` – Delete a monitor.
    

----------

### Optional Enhancements

-   Add charts or sparklines showing recent history (from `logs[]`).
    
-   Sorting by response time or status.
    
-   Pagination if list gets long.
   
----------

## Feature 6: Charts and Graphs

### **Goal**

Enhance user insights by visualizing uptime percentage and response time trends over time using interactive charts.

----------

### **Visualization Libraries**

Choose one of the following:

-   **Recharts** (recommended for React + Tailwind setups)
    
-   **Chart.js** (powerful, but requires more configuration)
    

----------

### **Tasks Breakdown**

#### 1. **Charts to Implement**

##### 1. **Uptime History Chart**

-   **Type:** Bar or Area chart
    
-   **X-axis:** Dates (last 7 or 30 days)
    
-   **Y-axis:** Uptime % (0–100%)
    
-   **Data:** Derived from logs array
    

**Example data format:**

```ts
[
  { date: '2025-04-01', uptime: 100 },
  { date: '2025-04-02', uptime: 95 },
  { date: '2025-04-03', uptime: 90 },
  ...
]

```

##### 2. **Response Time Trend Chart**

-   **Type:** Line chart
    
-   **X-axis:** Timestamps of recent logs (last 10–50 pings)
    
-   **Y-axis:** Response time in milliseconds
    

**Example data format:**

```ts
[
  { timestamp: '2025-04-09T12:30:00Z', responseTime: 110 },
  { timestamp: '2025-04-09T12:35:00Z', responseTime: 250 },
  ...
]

```

----------

#### 2. **Placement**

-   Option 1: **Expandable Drawer or Modal**
    
    -   Triggered by a “View Stats” button under each URL in the dashboard
        
    -   Charts appear in a focused view
        
-   Option 2: **Inline Accordion Below Each URL**
    
    -   Expands under the URL row
        
    -   Less immersive, but faster to explore multiple entries
        

----------

#### 3. **Backend Requirements**

-   Add `/api/user/monitors/:id/logs` endpoint to fetch logs for a single monitor
    
-   Consider pre-processing data (uptime %) server-side to reduce client load
    

----------

#### 4. **Chart Features**

-   Hover tooltips showing exact time and value
    
-   Custom legends and axis formatting (e.g., ms, %)
    
-   Responsive layout for mobile
    
-   Toggle for time range: **Last 7 days / 30 days**
    

----------

#### 5. **Data Source**

Each monitored URL should already have:

-   `logs[]`: An array of `{ status, responseTime, timestamp }`
    
-   Calculate uptime as:  
    `uptime = (number of UP statuses / total checks in timeframe) * 100`
    

----------

### Example UI Layout (Drawer Style)

```
┌────────────────────────────────────┐
│ URL: https://example.com          │
│ Status: UP                        │
│                                  ▼│
│ ──────────────────────────────── │
│ | Uptime Last 7 Days (Bar)     | │
│ ──────────────────────────────── │
│ | Response Time Trend (Line)   | │
└────────────────────────────────────┘

```

----------

## Feature 7: Export Logs

### **Goal**

Allow users to download monitoring logs for any saved URL in either **CSV** or **JSON** format for backup, reporting, or analysis purposes.

----------

### **Tasks Breakdown**

#### 1. **UI Component**

-   Add a dropdown or button group in the dashboard (beside each URL or in a modal):
    

```tsx
Export ▼
├── CSV
└── JSON

```

-   Place it under the “Actions” column or inside the modal that shows logs/charts.
    

----------

#### 2. **API Route: `/api/export-logs`**

-   **Method:** `POST`
    
-   **Request body:**
    

```ts
{
  monitorId: string,
  format: "csv" | "json"
}

```

-   **Steps:**
    
    1.  Authenticate user using session (via `getServerSession`).
        
    2.  Fetch logs for the given `monitorId` that belongs to the user.
        
    3.  Format logs:
        
        -   If `json`: use `JSON.stringify()`
            
        -   If `csv`: use [`json2csv`](https://www.npmjs.com/package/json2csv)
            
    4.  Return file blob with appropriate headers.
        
-   **Example headers:**
    

```ts
res.setHeader("Content-Type", "text/csv");
res.setHeader("Content-Disposition", "attachment; filename=logs.csv");

```

----------

#### 3. **Frontend Logic**

-   On dropdown selection:
    
    1.  Trigger API call with the selected format.
        
    2.  Receive the blob response.
        
    3.  Create a URL from the blob and trigger download:
        

```ts
const blob = await res.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `logs.${format}`;
a.click();

```

----------

#### 4. **Log Structure**

Each log entry looks like:

```ts
{
  status: "UP" | "DOWN",
  responseTime: number,
  timestamp: string
}

```

**CSV Example Output:**

```csv
status,responseTime,timestamp
UP,123,2025-04-10T15:23:00.000Z
DOWN,0,2025-04-10T15:28:00.000Z

```

----------

#### 5. **Optional Enhancements**

-   Add filters before export (e.g., date range or status)
    
-   Allow batch export for multiple URLs in one ZIP
    
-   Add a “Download All Logs” option under the dashboard header
----------

## Feature 8: Multi-URL Input Form

### **Goal**

Allow users to input and check or save **multiple URLs** at once, enhancing the user experience for those managing several endpoints.

----------

### **Tasks Breakdown**

#### 1. **UI Form Setup**

-   Start with a single input group:
    

```tsx
+----------------------+------------+
| [ URL Input Field ]  | [ Interval ▼ ] |
+----------------------+------------+

```

-   Add a button below:  
    `"➕ Add another URL"`
    
-   On click, dynamically append another identical input group.
    
-   Each input group should have:
    
    -   URL field (required)
        
    -   Interval dropdown (`5m`, `10m`, `30m`, `1h`…)
        

----------

#### 2. **Form Behavior**

-   Users can add as many URLs as needed.
    
-   Allow removal of any added group except the first.
    
-   Validate all fields before submission.
    

----------

#### 3. **Use Cases**

##### **Guest User Flow:**

-   Show a “Check All Now” button.
    
-   On submit:
    
    -   Loop through all inputs.
        
    -   For each, call `/api/check-url` with the URL.
        
    -   Display results in a card/list view:
        

```plaintext
URL | Status | Response Time | Timestamp

```

##### **Logged-in User Flow:**

-   Replace action button with: “Save & Monitor All”
    
-   On submit:
    
    -   Send array of URLs + intervals to `/api/save-urls`.
        
    -   Backend saves each entry to MongoDB with user ID.
        
    -   Show success/error per URL.
        

----------

#### 4. **API Enhancements**

##### `/api/save-urls` (for logged-in users)

-   **Method:** `POST`
    
-   **Body:**
    

```ts
[
  { url: string, interval: string },
  ...
]

```

-   **Logic:**
    
    -   Validate session and input.
        
    -   Loop through URLs and save each using the `UrlMonitor` model.
        
    -   Return response with individual success/failure status.
        

##### `/api/check-url` (for guest use)

-   Can be reused by looping through each input on the frontend.
    

----------

#### 5. **Frontend Considerations**

-   Maintain form state using `useState` (array of objects).
    
-   Example:
    

```ts
[{ url: '', interval: '5m' }, { url: '', interval: '10m' }]

```

-   Render input groups using `.map()` on this state.
    

----------

#### 6. **UX Improvements (Optional)**

-   Add a button to **clear all fields**.
    
-   Add a **bulk paste** option for advanced users (parse and split).
    
-   Show summary before confirming save/check:
    
    ```
    You’re about to save 4 URLs with the following intervals:
    - google.com → 5m
    - vercel.com → 10m
    
    ```
----------

## Feature 9: Dockerization

### **Goal**

Enable smooth deployment of the entire URL Health Monitor app using Docker containers for both the Next.js application and the MongoDB database.

----------

### **Files Required**

#### 1. `Dockerfile`

Used to containerize the **Next.js app**. This sets up the Node environment, installs dependencies, builds the project, and starts the server.

```Dockerfile
# Base Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Build the Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

```

> **Note**: This assumes `npm run start` is set up to run the production server (e.g., `next start`). Adjust if using custom commands.

----------

#### 2. `docker-compose.yml`

Orchestrates both services: the **Next.js app** and **MongoDB database**. Handles linking, ports, and volumes.

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/healthdb
    depends_on:
      - mongo

  mongo:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:

```

----------

### **Tasks Summary**

#### Dockerize the Next.js app

-   Add a `Dockerfile` in the root of the project.
    
-   Ensure `next.config.js` is optimized for production if needed.
    
-   Run build during the Docker image creation process (`npm run build`).
    
-   Use `npm start` to launch the production server with `next start`.
    

#### Set up `docker-compose.yml`

-   Connects the app to a MongoDB instance named `mongo`.
    
-   Uses a volume (`mongo-data`) to persist MongoDB data across container restarts.
    
-   Exposes:
    
    -   App on port `3000`
        
    -   MongoDB on port `27017`
        

#### Environment Setup

-   The app accesses MongoDB through the internal Docker network using `mongo:27017`.
    
-   `MONGO_URI` should be referenced in `.env` or directly in runtime config using `process.env.MONGO_URI`.
    

----------

### **How to Run**

From the project root:

```bash
docker-compose up --build

```

-   App will be available at [http://localhost:3000](http://localhost:3000/).
    
-   MongoDB will be running and ready at `mongodb://localhost:27017/healthdb`.
----------

## Documentation (`/docs` section)

Create a `/docs` route with these:

### API Routes Reference

Route

Method

Auth?

Description

`/api/check-url`

POST

❌

Instantly check a single URL

`/api/monitor`

POST

✅

Save a URL for monitoring

`/api/monitor/:id`

PUT/DELETE

✅

Edit/Delete a monitored URL

`/api/logs/export`

GET

✅

Export logs in CSV or JSON

`/api/dashboard`

GET

✅

Fetch all user’s monitored URLs

----------

### Project Structure

```
/src
  /app
    /dashboard
    /docs
    /auth
  /components
  /lib
  /models
  /api
/public

```

----------

## Milestone Checklist

-   Guest check with URL form
    
-   Authentication
    
-   Save & monitor URLs (MongoDB)
    
-   Background monitoring & retry logic
    
-   Dashboard with table
    
-   Charts and trends
    
-   Export logs
    
-   Multi-input form
    
-   Dockerization
    
-   Docs route