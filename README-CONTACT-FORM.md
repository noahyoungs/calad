
# Contact Form Implementation

This document outlines the implementation of the contact form for cal.ad.

## Features

- Responsive contact form accessible without login
- Matches the design style of the landing page
- Integrated with Cloudflare Turnstile for spam protection
- Email delivery using Mailgun
- Form validation and error handling
- Success/error feedback to users

## Components

### 1. Frontend Components

- `components/landing/CaladContact.tsx`: The main contact form component with form fields, validation, and submission handling
- `app/contact/page.tsx`: The contact page that includes the contact form component and maintains the site's navigation

### 2. Backend Components

- `app/api/contact/route.ts`: API route that handles form submission, validates input, verifies Turnstile token, and sends emails via Mailgun

## How It Works

1. Users navigate to `/contact` or click the "Contact" link in the navigation
2. The form collects:
   - Name
   - Email
   - Message
   - Turnstile verification token
3. On submission:
   - Client-side validation ensures all fields are filled
   - Data is sent to the `/api/contact` API route
   - The API validates the data and Turnstile token
   - If valid, an email is sent to noah@aldeoinnovations.com with the form data
   - The user receives a success or error message

## Turnstile Integration

Cloudflare Turnstile is integrated to protect the form from spam and abuse:

- The Turnstile widget is displayed on the form
- When the user completes the verification, a token is generated
- The token is sent with the form data to the API
- The API verifies the token with Cloudflare before processing the form

## Email Configuration

Emails are sent using Mailgun with the following configuration:

- From: "Contact Form <configured-email@domain.com>"
- To: noah@aldeoinnovations.com
- Subject: [Contact Form] {subject from form}
- Reply-To: {user's email} - This allows direct replies to the user

## Development vs. Production

- In development mode, Turnstile verification is bypassed for easier testing
- Email sending is simulated in development mode with console logs
- In production, both Turnstile verification and email sending are fully functional

## Environment Variables

The following environment variables are required:

- `MAILGUN_API_KEY`: API key for Mailgun
- `MAILGUN_DOMAIN`: Your Mailgun domain
- `MAILGUN_EMAIL`: Email address to send from
- `TURNSTILE_SECRET_KEY`: Secret key for Cloudflare Turnstile
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Public site key for Cloudflare Turnstile (client-side)
