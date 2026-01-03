import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

// This endpoint will be called by Vercel cron or manually
// The actual email sync will be handled by a Python script
// For now, this is a placeholder that can trigger the sync

export async function POST(request: Request) {
  // Verify this is from a cron job or authenticated request
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if cron secret matches, or if it's a local dev request
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In production, this would call the Python sync script
    // For now, return status from the database
    const supabase = getServiceClient();

    const { count, error } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Sync endpoint ready',
      currentRecords: count,
      note: 'Run scripts/sync_emails.py to sync emails',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'POST to this endpoint to trigger sync',
  });
}
