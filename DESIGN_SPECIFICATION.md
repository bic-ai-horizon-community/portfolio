# AI Horizon - Design Specification

This document outlines the current UI/UX architecture, visual identity, and page structures for the **AI Horizon** community portal.

---

## 1. Brand Identity & Vision
**Core Mission**: Bridge the gap between academic theory and industry grade AI deployment.
**Vibe**: Premium, Futuristic, High-Tech, Academic, and "Developer-First".
**Target Audience**: Computer Science students, AI enthusiasts, and tech industry mentors.

---

## 2. Current Design System (Glassmorphism Dark)

### Color Palette
- **Primary**: `#3b82f6` (Vibrant Blue - used for accents, active states, and glowing effects).
- **Background (Page)**: `#0a0e1a` (Deep Obsidian).
- **Background (Card)**: `rgba(255, 255, 255, 0.03)` (Semi-transparent glass).
- **Text (Main)**: `#ffffff` (Pure White).
- **Text (Sub/Muted)**: `rgba(255, 255, 255, 0.6)` (Soft Grey).
- **Borders**: `rgba(148, 163, 184, 0.12)` (Subtle glass edges).

### Typography
- **Primary Font**: `Outfit` (loaded via Google Fonts).
- **Styles**: 
  - Large, bold headings for sections.
  - Monospaced fonts for "CLI" or "Code" visual elements.
  - Wide letter-spacing for metadata (dates/times).

### Key UI Elements
- **Glass Cards**: Cards with subtle backdrops blurs (`backdrop-filter: blur(16px)`), thin borders, and soft shadows.
- **Micro-Animations**: Hover scales (1.02x), shimmering skeleton loaders, and glowing badges.
- **Iconography**: Clean, stroke-based icons.

---

## 3. Core Pages & Layouts

### 1. Landing Page (Home)
- **Hero Section**: 
  - Left: "Architecting the Intelligence Frontier" title.
  - Right: Floating "CLI Visual Card" showing fake terminal logs and the AI Horizon logo.
- **Bento Grid**: A 4-column mixed-height grid highlighting features (Workshops, Network, Stats, Partners).
- **Latest Timeline**: Split section for "Latest Events" and "Latest Workshops" with vertical connectors.

### 2. Events Module (`/events`)
- **List Page**: A grid of cards. Each card shows status (Open/Ongoing/Completed), Title, Date Range, and a short snippet.
- **Detail Page**: 
  - **Hero**: Large background with primary metadata (Date, Time, Location).
  - **Content**: Rich description, "Organized By" section, and Registration CTAs.

### 3. Workshops Module (`/workshops`)
- **List Page**: Similar to Events but focused on learning outcomes.
- **Detail Page**: Includes speaker info and "Materials/Resources" placeholders.

### 4. Admin Portal (`/admin`)
- **Dashboard**: High-level stats.
- **CRUD Tables**: Management of Users, Events, and Workshops.
- **Forms**: Advanced inputs for scheduling (Multi-day support), Speaker details, and Media uploads.

### 5. User Dashboard (`/dashboard`)
- Personalized view for registered events and profile settings.

---

## 4. Visual Directives for the Designer
- **Standardized Dividers**: Use the centered dot `·` instead of pipes `|`.
- **Date Formatting**: Always use "Month Day, Year" (e.g., May 6, 2026). Avoid weekdays unless specific.
- **Metadata Color**: Metadata like dates/speakers should remain in the `--text-sub` (Grey) tone to maintain visual hierarchy.
- **Logo Usage**: The AI Horizon logo should be prominent in the navbar (height: 56px) and as the site favicon.

---

## 5. Technical Stack (For Reference)
- **Framework**: Next.js (App Router).
- **Styling**: Vanilla CSS Modules (Glassmorphism based).
- **Database**: Supabase / Prisma.
- **Icons**: Custom SVG icons.
