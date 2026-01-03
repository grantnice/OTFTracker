#!/usr/bin/env python3
"""
OTF Email Scraper
Connects to Gmail via IMAP, finds Orangetheory Performance Summary emails,
extracts workout data, and syncs to Supabase.

Usage:
    python scripts/sync_emails.py

Environment variables required:
    EMAIL_USER - Gmail address
    EMAIL_PASS - Gmail app password
    SUPABASE_URL - Supabase project URL
    SUPABASE_SERVICE_KEY - Supabase service role key
"""

import os
import re
import imaplib
import email
from email.header import decode_header
from datetime import datetime
from typing import Optional
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Configuration
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = os.getenv('EMAIL_PASS')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SECRET_KEY')

def get_supabase_client() -> Client:
    """Create Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def connect_to_gmail() -> imaplib.IMAP4_SSL:
    """Connect to Gmail via IMAP."""
    if not EMAIL_USER or not EMAIL_PASS:
        raise ValueError("EMAIL_USER and EMAIL_PASS must be set")

    print(f"Connecting to Gmail as {EMAIL_USER}...")
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login(EMAIL_USER, EMAIL_PASS)
    return mail

def search_otf_emails(mail: imaplib.IMAP4_SSL) -> list:
    """Search for Orangetheory Performance Summary emails."""
    # Search All Mail to get archived emails too
    mail.select('"[Gmail]/All Mail"')

    # Search for OTF workout summary emails
    # OTbeatReport@orangetheoryfitness.com sends "way to conquer that workout" emails
    search_criteria = '(FROM "orangetheoryfitness" SUBJECT "workout")'

    print(f"Searching for emails: {search_criteria}")
    status, messages = mail.search(None, search_criteria)

    if status != 'OK':
        print("No messages found")
        return []

    email_ids = messages[0].split()
    print(f"Found {len(email_ids)} OTF emails")
    return email_ids

def decode_email_subject(subject: str) -> str:
    """Decode email subject."""
    if subject is None:
        return ""
    decoded_parts = decode_header(subject)
    decoded_subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            decoded_subject += part.decode(encoding or 'utf-8', errors='replace')
        else:
            decoded_subject += part
    return decoded_subject

def parse_email_date(msg) -> Optional[datetime]:
    """Extract date from email headers."""
    date_str = msg.get('Date')
    if not date_str:
        return None

    # Parse various date formats
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str)
    except Exception:
        pass

    # Fallback parsing
    try:
        # Remove timezone name if present
        date_str = re.sub(r'\s*\([A-Z]+\)\s*$', '', date_str)
        return datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %z')
    except Exception as e:
        print(f"Could not parse date: {date_str} - {e}")
        return None

def extract_number(text: str) -> Optional[float]:
    """Extract a number from text."""
    if not text:
        return None
    # Find numbers (including decimals)
    match = re.search(r'[\d,]+\.?\d*', text.replace(',', ''))
    if match:
        try:
            return float(match.group())
        except ValueError:
            return None
    return None

def parse_workout_data(html_body: str) -> dict:
    """Parse workout metrics from email HTML body."""
    soup = BeautifulSoup(html_body, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)

    data = {
        'treadmill_distance': None,
        'rower_distance': None,
        'splat_points': None,
        'calories': None,
    }

    # OTF email format (from OTbeatReport):
    # "674 CALORIES BURNED"
    # "12 SPLAT POINTS"
    # "TREADMILL PERFORMANCE TOTALS 3.6 miles Total Distance"
    # "ROWER PERFORMANCE TOTALS 860 m Total Distance"

    # Calories - number immediately before "CALORIES BURNED"
    cal_match = re.search(r'(\d{2,4})\s*CALORIES\s*BURNED', text, re.IGNORECASE)
    if cal_match:
        data['calories'] = int(cal_match.group(1))

    # Splat Points - number immediately before "SPLAT POINTS"
    splat_match = re.search(r'(\d{1,2})\s*SPLAT\s*POINTS', text, re.IGNORECASE)
    if splat_match:
        data['splat_points'] = int(splat_match.group(1))

    # Treadmill distance - look for pattern after "TREADMILL PERFORMANCE TOTALS"
    # Format: "3.6 miles Total Distance" or just "3.6 miles"
    tread_match = re.search(
        r'TREADMILL\s*PERFORMANCE\s*TOTALS?\s*(\d+\.?\d*)\s*miles?',
        text, re.IGNORECASE
    )
    if tread_match:
        data['treadmill_distance'] = float(tread_match.group(1))

    # Rower distance - look for pattern after "ROWER PERFORMANCE TOTALS"
    # Format: "860 m Total Distance" or "860m"
    rower_match = re.search(
        r'ROWER\s*PERFORMANCE\s*TOTALS?\s*([\d,]+)\s*m\b',
        text, re.IGNORECASE
    )
    if rower_match:
        data['rower_distance'] = int(rower_match.group(1).replace(',', ''))

    return data

def get_email_body(msg) -> str:
    """Extract HTML body from email message."""
    body = ""

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))

            if "attachment" in content_disposition:
                continue

            if content_type == "text/html":
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    body = payload.decode(charset, errors='replace')
                    break
                except Exception:
                    continue
            elif content_type == "text/plain" and not body:
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    body = payload.decode(charset, errors='replace')
                except Exception:
                    continue
    else:
        try:
            payload = msg.get_payload(decode=True)
            charset = msg.get_content_charset() or 'utf-8'
            body = payload.decode(charset, errors='replace')
        except Exception as e:
            print(f"Error decoding body: {e}")

    return body

def process_email(mail: imaplib.IMAP4_SSL, email_id: bytes) -> Optional[dict]:
    """Process a single email and extract workout data."""
    try:
        status, msg_data = mail.fetch(email_id, '(RFC822)')
        if status != 'OK':
            return None

        email_body = msg_data[0][1]
        msg = email.message_from_bytes(email_body)

        # Get email date
        workout_date = parse_email_date(msg)
        if not workout_date:
            print(f"Could not parse date for email {email_id}")
            return None

        # Get subject
        subject = decode_email_subject(msg.get('Subject', ''))

        # Get and parse body
        body = get_email_body(msg)
        if not body:
            print(f"No body found for email {email_id}")
            return None

        workout_data = parse_workout_data(body)

        return {
            'workout_date': workout_date.strftime('%Y-%m-%d'),
            'email_subject': subject,
            **workout_data
        }

    except Exception as e:
        print(f"Error processing email {email_id}: {e}")
        return None

def sync_to_supabase(supabase: Client, workouts: list) -> tuple:
    """Sync workout data to Supabase. Returns (inserted, skipped) counts."""
    inserted = 0
    skipped = 0

    for workout in workouts:
        try:
            # Check if workout already exists
            existing = supabase.table('workouts').select('id').eq(
                'workout_date', workout['workout_date']
            ).execute()

            if existing.data:
                skipped += 1
                continue

            # Insert new workout
            supabase.table('workouts').insert(workout).execute()
            inserted += 1
            print(f"Inserted workout: {workout['workout_date']}")

        except Exception as e:
            print(f"Error syncing workout {workout['workout_date']}: {e}")
            skipped += 1

    return inserted, skipped

def main():
    """Main sync function."""
    print("=" * 50)
    print("OTF Email Sync")
    print("=" * 50)

    # Connect to services
    try:
        supabase = get_supabase_client()
        mail = connect_to_gmail()
    except Exception as e:
        print(f"Connection error: {e}")
        return

    # Search for emails
    email_ids = search_otf_emails(mail)

    if not email_ids:
        print("No OTF emails found")
        mail.logout()
        return

    # Process emails
    workouts = []
    for i, email_id in enumerate(email_ids):
        print(f"Processing email {i + 1}/{len(email_ids)}...", end='\r')
        workout = process_email(mail, email_id)
        if workout:
            workouts.append(workout)

    print()  # New line after progress
    print(f"Successfully parsed {len(workouts)} workout emails")

    # Sync to Supabase
    if workouts:
        inserted, skipped = sync_to_supabase(supabase, workouts)
        print()
        print("=" * 50)
        print(f"Sync complete!")
        print(f"  Found: {len(email_ids)} emails")
        print(f"  Parsed: {len(workouts)} workouts")
        print(f"  Inserted: {inserted} new records")
        print(f"  Skipped: {skipped} (duplicates or errors)")
        print("=" * 50)

    # Cleanup
    mail.logout()

if __name__ == '__main__':
    main()
