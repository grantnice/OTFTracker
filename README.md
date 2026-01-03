# OTF Tracker

A personal dashboard to track your Orangetheory Fitness workout stats with beautiful visualizations.

## Features

- Scrapes OTF "Performance Summary" emails from Gmail
- Tracks treadmill distance, rower distance, splat points, and calories
- Rich dashboard with trend charts, stats cards, and calendar heatmap
- Simple password protection
- Mobile-responsive design
- Daily auto-sync via Vercel cron

## Setup

### 1. Create Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Get your project URL and keys from Settings > API

### 2. Configure Gmail

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication if not already enabled
3. Go to App Passwords and generate a new password for "Mail"
4. Save this 16-character password

### 3. Set Environment Variables

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-password
SITE_PASSWORD=your-dashboard-password
```

### 4. Install Dependencies

```bash
npm install
```

For the Python sync script:

```bash
pip install -r scripts/requirements.txt
```

### 5. Run Initial Sync

Import your historical OTF emails:

```bash
python scripts/sync_emails.py
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your site password.

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

The daily sync cron job is configured in `vercel.json` to run at 8 AM UTC.

## Project Structure

```
otf-tracker/
├── app/
│   ├── page.tsx              # Main dashboard
│   └── api/
│       ├── workouts/         # Workout data API
│       ├── auth/             # Authentication
│       └── sync/             # Sync trigger
├── components/
│   ├── Dashboard.tsx         # Main layout
│   ├── StatsCards.tsx        # Summary metrics
│   ├── TrendChart.tsx        # Distance trends
│   ├── WorkoutTable.tsx      # History table
│   └── CalendarHeatmap.tsx   # Frequency visual
├── lib/
│   ├── supabase.ts           # Database client
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utilities
└── scripts/
    └── sync_emails.py        # Email scraper
```

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Recharts
- Supabase (PostgreSQL)
- Vercel
