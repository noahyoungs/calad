import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Verify Mailgun webhook signature
// Set this to false during testing if needed
export const VERIFY_WEBHOOK = true;

// Set this to false during testing if needed
export const VERIFY_SPAM_FILTER = true;

// Email verification rate limiting configuration
export const EMAIL_VERIFICATION_RATE_LIMITS = {
  MAX_ATTEMPTS_PER_EMAIL: 4, // Maximum verification attempts per email in the time window
  TIME_WINDOW_HOURS: 12,     // Time window in hours (rolling window)
  COOLDOWN_HOURS: 12,        // Cooldown period after reaching the limit
};

export const RECIPIENT_EMAIL = process.env.MAILGUN_EMAIL || "hello@cal.ad";

// Allowed MIME types for email attachments
export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/webp',
  'image/jpeg',
  'application/pdf',
  'text/plain'
]);

// Initialize Mailgun
const mailgun = new Mailgun(formData);
export const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: 'https://api.mailgun.net',
});
