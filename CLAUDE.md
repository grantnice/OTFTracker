# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint

# Email sync (Python)
pip install -r scripts/requirements.txt  # Install Python dependencies
python scripts/sync_emails.py            # Sync OTF emails from Gmail to Supabase
```

## Architecture

This is a personal Orangetheory Fitness workout tracker that scrapes "Performance Summary" emails from Gmail and displays them in a dashboard.

### Data Flow
1. **Python email scraper** (`scripts/sync_emails.py`) connects to Gmail via IMAP, parses OTF workout emails using regex patterns, and writes to Supabase
2. **Next.js API routes** serve workout data from Supabase to the frontend
3. **React dashboard** displays stats, trend charts, weekday frequency, workout history table, and annual stats

### Key Components
- `app/page.tsx` - Entry point with auth state management (shows LoginForm or Dashboard)
- `components/Dashboard.tsx` - Main layout orchestrating StatsCards, TrendChart, WeekdayFrequency, WorkoutTable, AnnualStats
- `components/TrendChart.tsx` - Performance charts with chart type (line/bar/scatter), date range filter (30d/90d/1y/all), and year markers for multi-year data
- `lib/utils.ts` - Core calculation functions: `calculateStats()`, `prepareChartData()`, `calculateWeeklyAverage()`, `getWeekdayFrequency()`, `getAnnualStats()`
- `lib/supabase.ts` - Supabase client factory with `getSupabase()` (anon key) and `getServiceClient()` (service key)

### Email Parsing
The Python scraper (`scripts/sync_emails.py`) uses specific regex patterns to extract metrics from OTF email HTML:
- Calories: `(\d{2,4})\s*CALORIES\s*BURNED`
- Splat points: `(\d{1,2})\s*SPLAT\s*POINTS`
- Treadmill: `TREADMILL\s*PERFORMANCE\s*TOTALS?\s*(\d+\.?\d*)\s*miles?`
- Rower: `ROWER\s*PERFORMANCE\s*TOTALS?\s*([\d,]+)\s*m\b`

### Database
Single `workouts` table with columns: `workout_date` (unique), `treadmill_distance`, `rower_distance`, `splat_points`, `calories`, `email_subject`. Schema in `supabase-schema.sql`.

### Deployment
- Vercel hosting with cron job at `/api/sync` running daily at 8 AM UTC (`vercel.json`)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `SITE_PASSWORD`
