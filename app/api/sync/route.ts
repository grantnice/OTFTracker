import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { syncEmails } from "@/lib/email-sync";

export async function POST() {
  try {
    // Run the TypeScript email sync
    const result = await syncEmails();

    // Get current workout count
    const supabase = getServiceClient();
    const { count: totalWorkouts } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
      totalWorkouts,
      newWorkouts: result.inserted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("workout_date")
      .order("workout_date", { ascending: false })
      .limit(1);

    if (error) throw error;

    const lastSync = data?.[0]?.workout_date || null;

    return NextResponse.json({
      status: "ready",
      lastWorkoutDate: lastSync,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
