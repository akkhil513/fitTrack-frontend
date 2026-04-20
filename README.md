# FitTrack Frontend

A 100-day fitness challenge PWA built with Angular 17. Track workouts, nutrition, measurements, and compete on a leaderboard — all from a mobile-first progressive web app.

## Tech Stack

- **Framework:** Angular 17 (standalone components, signals, `@for`/`@if` control flow)
- **Auth:** AWS Cognito via `aws-amplify`
- **API:** REST backend on AWS API Gateway + Lambda
- **Hosting:** S3 + CloudFront
- **PWA:** Service worker with offline support, push notifications, install prompt

## Features

- **Onboarding** — questionnaire (physique, goals, injuries, preferences) → AI-generated training/nutrition plan
- **Dashboard** — day counter, weekly schedule, daily checklist
- **Log** — per-day exercise logging with sets/reps/weight, custom exercises, exercise picker with alternatives
- **Nutrition** — food search (USDA API), serving presets, daily macro totals
- **Schedule** — weekly training split loaded from your personalized plan
- **Progress** — body measurements tracking (weight, waist, chest, shoulders, arms)
- **Leaderboard** — streak-based ranking against other users
- **Profile** — editable info, full plan viewer (strategy/training/nutrition/supplements/recovery), stats

## Project Structure

```
src/
├── app/
│   ├── app.component.ts          # Root component
│   ├── app.config.ts             # App config (providers, interceptors)
│   ├── app.routes.ts             # Top-level routes
│   ├── core/
│   │   ├── guards/               # Auth & onboarding route guards
│   │   ├── interceptors/         # JWT auth interceptor
│   │   └── services/             # API, Auth, PWA, Exercise, Nutrition services
│   └── features/
│       ├── auth/                  # Login & Register
│       ├── dashboard/             # Main dashboard + tabs
│       │   ├── checklist/         # Daily checklist
│       │   ├── exercises/         # Exercise picker & detail
│       │   ├── leaderboard/       # User rankings
│       │   ├── log/               # Daily workout + nutrition log
│       │   ├── nutrition/         # Food search component
│       │   ├── progress/          # Body measurements
│       │   └── schedule/          # Weekly training schedule
│       ├── onboarding/            # Questionnaire flow
│       └── profile/               # User profile & plan viewer
├── environments/                  # Environment configs
└── index.html
```

## Setup

### Prerequisites

- Node.js 18+
- Angular CLI 17 (`npm install -g @angular/cli`)

### Install

```bash
git clone <repo-url>
cd fitTrack-frontend
npm install
```

### Environment

Configure `src/environments/environment.ts` with your:
- API Gateway URL
- AWS Cognito pool IDs
- USDA API key
- ExerciseDB API key

### Run

```bash
ng serve
```

Open [http://localhost:4200](http://localhost:4200)

### Build

```bash
ng build --configuration production
```

Output: `dist/fittrack-frontend/`

### Deploy (S3 + CloudFront)

```bash
S3_BUCKET=your-bucket CF_DIST_ID=your-dist-id npm run deploy
```
