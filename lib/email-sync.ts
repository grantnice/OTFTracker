/**
 * OTF Email Sync - TypeScript Implementation
 *
 * Connects to Gmail via IMAP, finds Orangetheory Performance Summary emails,
 * extracts workout data, and syncs to Supabase.
 */

import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import * as cheerio from "cheerio";
import { getServiceClient } from "./supabase";

export interface WorkoutData {
  workout_date: string;
  email_subject: string;
  treadmill_distance: number | null;
  rower_distance: number | null;
  splat_points: number | null;
  calories: number | null;
}

export interface SyncResult {
  success: boolean;
  message: string;
  details: string;
  found: number;
  parsed: number;
  inserted: number;
  skipped: number;
}

/**
 * Parse workout metrics from email HTML body using regex patterns.
 * Matches the Python implementation exactly.
 */
function parseWorkoutData(htmlBody: string): Partial<WorkoutData> {
  const $ = cheerio.load(htmlBody);
  const text = $.text().replace(/\s+/g, " ");

  const data: Partial<WorkoutData> = {
    treadmill_distance: null,
    rower_distance: null,
    splat_points: null,
    calories: null,
  };

  // Calories - number immediately before "CALORIES BURNED"
  const calMatch = text.match(/(\d{2,4})\s*CALORIES\s*BURNED/i);
  if (calMatch) {
    data.calories = parseInt(calMatch[1], 10);
  }

  // Splat Points - number immediately before "SPLAT POINTS"
  const splatMatch = text.match(/(\d{1,2})\s*SPLAT\s*POINTS/i);
  if (splatMatch) {
    data.splat_points = parseInt(splatMatch[1], 10);
  }

  // Treadmill distance - pattern after "TREADMILL PERFORMANCE TOTALS"
  const treadMatch = text.match(
    /TREADMILL\s*PERFORMANCE\s*TOTALS?\s*(\d+\.?\d*)\s*miles?/i,
  );
  if (treadMatch) {
    data.treadmill_distance = parseFloat(treadMatch[1]);
  }

  // Rower distance - pattern after "ROWER PERFORMANCE TOTALS"
  const rowerMatch = text.match(
    /ROWER\s*PERFORMANCE\s*TOTALS?\s*([\d,]+)\s*m\b/i,
  );
  if (rowerMatch) {
    data.rower_distance = parseInt(rowerMatch[1].replace(/,/g, ""), 10);
  }

  return data;
}

/**
 * Process a parsed email and extract workout data.
 */
function processEmail(parsed: ParsedMail): WorkoutData | null {
  const date = parsed.date;
  if (!date) {
    return null;
  }

  const subject = parsed.subject || "";
  const html = parsed.html || parsed.textAsHtml || "";

  if (!html) {
    return null;
  }

  const workoutData = parseWorkoutData(html);

  // Format date as YYYY-MM-DD
  const workoutDate = date.toISOString().split("T")[0];

  return {
    workout_date: workoutDate,
    email_subject: subject,
    treadmill_distance: workoutData.treadmill_distance ?? null,
    rower_distance: workoutData.rower_distance ?? null,
    splat_points: workoutData.splat_points ?? null,
    calories: workoutData.calories ?? null,
  };
}

/**
 * Collect stream data into a buffer.
 */
function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/**
 * Connect to Gmail and fetch OTF workout emails.
 */
function fetchEmails(): Promise<ParsedMail[]> {
  return new Promise((resolve, reject) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      reject(new Error("EMAIL_USER and EMAIL_PASS must be set"));
      return;
    }

    const imap = new Imap({
      user: emailUser,
      password: emailPass,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const emailBuffers: Buffer[] = [];
    let messageCount = 0;
    let totalCount = 0;

    imap.once("ready", () => {
      // Open All Mail to get archived emails too
      imap.openBox("[Gmail]/All Mail", true, (err) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        // Search for OTF workout emails
        const searchCriteria = [
          ["FROM", "orangetheoryfitness"],
          ["SUBJECT", "workout"],
        ];

        imap.search(searchCriteria, (searchErr, results) => {
          if (searchErr) {
            imap.end();
            reject(searchErr);
            return;
          }

          if (!results || results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          totalCount = results.length;
          console.log(`Found ${totalCount} OTF emails`);

          const fetch = imap.fetch(results, { bodies: "" });

          fetch.on("message", (msg) => {
            msg.on("body", (stream) => {
              streamToBuffer(stream as NodeJS.ReadableStream)
                .then((buffer) => {
                  emailBuffers.push(buffer);
                  messageCount++;
                  if (messageCount === totalCount) {
                    imap.end();
                  }
                })
                .catch(() => {
                  messageCount++;
                  if (messageCount === totalCount) {
                    imap.end();
                  }
                });
            });
          });

          fetch.once("error", (fetchErr) => {
            imap.end();
            reject(fetchErr);
          });
        });
      });
    });

    imap.once("error", (err: Error) => {
      reject(err);
    });

    imap.once("end", async () => {
      // Parse all collected email buffers
      const emails: ParsedMail[] = [];
      for (const buffer of emailBuffers) {
        try {
          const parsed = await simpleParser(buffer);
          emails.push(parsed);
        } catch {
          // Skip emails that fail to parse
        }
      }
      resolve(emails);
    });

    imap.connect();
  });
}

/**
 * Sync workouts to Supabase database.
 */
async function syncToSupabase(
  workouts: WorkoutData[],
): Promise<{ inserted: number; skipped: number }> {
  const supabase = getServiceClient();
  let inserted = 0;
  let skipped = 0;

  for (const workout of workouts) {
    try {
      // Check if workout already exists
      const { data: existing } = await supabase
        .from("workouts")
        .select("id")
        .eq("workout_date", workout.workout_date)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new workout
      const { error } = await supabase.from("workouts").insert(workout);

      if (error) {
        console.error(
          `Error inserting workout ${workout.workout_date}:`,
          error,
        );
        skipped++;
      } else {
        console.log(`Inserted workout: ${workout.workout_date}`);
        inserted++;
      }
    } catch {
      // Record doesn't exist, insert it
      const { error } = await supabase.from("workouts").insert(workout);
      if (error) {
        skipped++;
      } else {
        console.log(`Inserted workout: ${workout.workout_date}`);
        inserted++;
      }
    }
  }

  return { inserted, skipped };
}

/**
 * Main sync function - fetches emails and syncs to database.
 */
export async function syncEmails(): Promise<SyncResult> {
  console.log("=".repeat(50));
  console.log("OTF Email Sync (TypeScript)");
  console.log("=".repeat(50));

  try {
    // Fetch emails from Gmail
    console.log("Connecting to Gmail...");
    const emails = await fetchEmails();
    console.log(`Fetched ${emails.length} emails`);

    if (emails.length === 0) {
      return {
        success: true,
        message: "No OTF emails found",
        details: "No emails matching search criteria",
        found: 0,
        parsed: 0,
        inserted: 0,
        skipped: 0,
      };
    }

    // Process emails into workout data
    const workouts: WorkoutData[] = [];
    for (const email of emails) {
      const workout = processEmail(email);
      if (workout) {
        workouts.push(workout);
      }
    }
    console.log(`Parsed ${workouts.length} workouts from emails`);

    // Sync to Supabase
    const { inserted, skipped } = await syncToSupabase(workouts);

    const details = [
      `Found: ${emails.length} emails`,
      `Parsed: ${workouts.length} workouts`,
      `Inserted: ${inserted} new records`,
      `Skipped: ${skipped} (duplicates or errors)`,
    ].join("\n");

    console.log("=".repeat(50));
    console.log("Sync complete!");
    console.log(details);
    console.log("=".repeat(50));

    return {
      success: true,
      message: `Sync complete! ${inserted} new workout${inserted !== 1 ? "s" : ""} added.`,
      details,
      found: emails.length,
      parsed: workouts.length,
      inserted,
      skipped,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", message);
    return {
      success: false,
      message: "Sync failed",
      details: message,
      found: 0,
      parsed: 0,
      inserted: 0,
      skipped: 0,
    };
  }
}
