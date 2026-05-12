# AI Horizon Web App

A student AI community platform for managing events, workshops, registrations, and attendance.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **File Storage:** Cloudinary
- **Styling:** CSS Modules (Vanilla CSS)

## Getting Started

### 1. Setup Environment Variables
Create a `.env` file in the root directory and add the following:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_horizon?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```

## User Roles
1. **Admin:** Founders, Co-founders. Full CRUD access to events/workshops, user management, and attendance verification.
2. **Member:** Registered community members. Can view all data and register for events.
3. **Public:** General students. Can view and register for events.

## Features
- **Event System:** Title, description, status (OPEN_FOR_REGISTRATION, ONGOING, COMPLETED).
- **Workshop System:** Educational focus, schedule, speakers, materials.
- **Registration:** Role-based registration with business rules.
- **Attendance:** Verification by Admins during ONGOING status.
- **Media Gallery:** Image and video support via Cloudinary.



   1     # This updates your database tables
   2     npx prisma db push
   3
   4     # This updates the code libraries to recognize 'showQr'
   5     npx prisma generate
   3. Restart your dev server:
   1     npm run dev
