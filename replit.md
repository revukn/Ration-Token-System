# E-Ration Token System

## Overview

Karnataka Government E-Ration Token System - a web application for digital ration distribution management with two modules: User Application and Admin Application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Session-based (bcryptjs + express-session)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Routing**: wouter (frontend)

## Features

### User Module
- Registration (name, address, email, password)
- Login with session management
- Ration card verification (sample cards: KA-BNG-2024-001, KA-BNG-2024-002, KA-MYS-2024-003)
- Family member selection
- Verification: Face Recognition (simulated) or OTP-based Aadhaar
- Token generation and display

### Admin Module
- Admin login (admin@eration.gov.in / admin123)
- Dashboard with statistics
- View all tokens with status filtering
- Verify, approve, and distribute tokens
- Recent activity feed

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `users` — id, name, email, password, address, role (user/admin)
- `tokens` — id, token_number, ration_card_number, holder_name, selected_members (JSON), verification_type, status, user_id, timestamps

## Sample Data

- Admin: admin@eration.gov.in / admin123
- Sample ration cards: KA-BNG-2024-001, KA-BNG-2024-002, KA-MYS-2024-003

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
