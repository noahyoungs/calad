# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server

## Architecture Overview

### Application Structure
This is a Next.js 15 application with TypeScript that implements a calendar AI assistant (cal.ad) for managing Google Calendar events through natural language interactions.

**Core Technologies:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, HeroUI
- **Backend**: Next.js API routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK with Google Vertex AI and OpenAI integrations
- **Authentication**: Supabase Auth with Google OAuth
- **Calendar Integration**: Google Calendar API via googleapis
- **Payments**: Lemon Squeezy webhooks
- **Email**: Mailgun integration
- **Analytics**: PostHog

### Key Directories

**`/app`** - Next.js App Router pages and API routes
- `/api` - Backend API endpoints (chat, webhooks, email verification)
- `/app` - Main application pages (chat interface, onboarding, settings)
- `/auth` - Authentication callbacks

**`/actions`** - Server Actions for calendar operations, chat, settings, and OAuth
- `/calendar` - Calendar-specific actions (create, modify, delete events)

**`/components`** - React components organized by feature
- `/chat` - Chat interface components and hooks
- `/calendar` - Calendar event confirmation and form components
- `/landing` - Marketing page components
- `/settings` - User settings components

**`/utils`** - Utility functions and configuration
- `/calendar` - Calendar API utilities and types
- `/email` - Email system utilities and templates
- `/supabase` - Database client configurations

### System Prompt Architecture
The AI assistant uses a sophisticated system prompt (utils/system-prompt.ts) that:
- Adapts behavior based on user's subscription tier (free vs paid)
- Handles timezone conversions and calendar markdown generation
- Provides tool selection guidance for calendar operations
- Includes comprehensive location and time handling guidelines

### Calendar Integration
The application provides different capabilities based on subscription:
- **Free tier**: Create calendar events only
- **Paid tier**: Full CRUD operations (create, read, update, delete) plus event search

### State Management
- Chat state managed through React Context (contexts/chat-context.tsx)
- Server Actions for data mutations
- Supabase for persistent storage

### Key Configuration Files
- `next.config.ts` - Next.js configuration with PostHog rewrites and MDX editor support
- `tailwind.config.ts` - Custom theme with HeroUI integration and brand colors
- `supabase/config.toml` - Local Supabase development configuration

### Important Implementation Notes
- All calendar operations use IANA timezone formats
- Event confirmations shown via dialog before calendar operations
- Location handling supports physical addresses, online meetings, and flexible locations
- Recurrence patterns follow RFC 5545 format
- Email verification system integrated with settings
- Rate limiting implemented for API endpoints