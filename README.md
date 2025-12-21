
# Zintas Family Clinic - Simple Booking App

This is a minimal full-stack example to let patients see a doctor's availability, 
book a time slot, and store the booking in **Google Sheets**. 
It also sends confirmation emails (if SMTP is configured).

> **Important:** This demo does **not** process real card payments.  
> For security, never store raw card numbers in Google Sheets.  
> Use a provider like **Stripe** or your EHR's billing module before going live.

## Structure

- `backend/` – Node.js + Express API, Google Sheets + email integration
- `frontend/` – Static HTML, CSS, and JS (simple CharmEHR-style layout)

## Quick Start

1. Open `backend/.env.example`, copy it to `.env`, and fill in:
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`
   - SMTP settings (optional but recommended).

2. Create a Google Sheet with a tab named **Bookings** and this header row in row 1:

   | Timestamp | BookingId | Date | Time | Name | Email | Phone | Reason |

3. In Google Cloud Console:
   - Create a project and enable **Google Sheets API**.
   - Create a **Service Account** and download the JSON key.
   - Save it as `backend/google-service-account-key.json`.
   - Share your Sheet with the service account email (Editor access).

4. Install backend dependencies:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. Open the frontend in your browser:

   - With the backend running on port 4000, go to:  
     `http://localhost:4000/`

You can now:

- Pick a date
- See available slots
- Select a slot
- Enter patient details
- Confirm the appointment

The booking will be stored in your Google Sheet, and emails sent if configured.

