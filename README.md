# Baby Growth App

A cross-platform mobile app (iOS & Android) built with Expo React Native to help parents track their baby's health and development.

## Features

- **Feeding Log** — Track breastfeeds and formula feeds with amounts, duration, and push notification reminders
- **Growth Tracking** — Record weight, height, and head circumference with WHO 0–24 month percentile charts
- **Vaccination Records** — Sweden national schedule pre-loaded (Socialstyrelsen), mark vaccines as done with date & clinic, add custom vaccines
- **Doctor Access** — Generate unique invite codes for view-only access by pediatricians
- **PDF Reports** — Generate and share health reports directly with your doctor
- **Multi-user** — Supports multiple caregivers

## Tech Stack

- Expo (React Native) — cross-platform iOS & Android
- expo-sqlite — local-only storage, no cloud sync
- expo-notifications — push notification reminders
- expo-print + expo-sharing — PDF generation & sharing
- react-native-chart-kit — WHO growth charts

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

## Data & Privacy

All data is stored locally on the device. Nothing is sent to any server.
