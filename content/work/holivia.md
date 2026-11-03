---
title: Designing and building a calmer mental-health app
client: Holivia
role: Frontend Engineer
period: 2022 — 2024
order: 4
summary: The whole frontend of a mental-health platform, designed and rebuilt — including a calming audio player and video calls with therapists, in vanilla JavaScript, CSS and HTML.
stack: [React, Ruby on Rails, JavaScript, CSS, HTML]
cover:
  src: work/holivia/cover.webp
  alt: Three Holivia screens on phones — the audio player for a breathing session, a video call with a therapist, and wellbeing questionnaire results.
cardCover:
  src: work/holivia/audio-player-screen.webp
  alt: The Holivia audio player for a “Cohérence cardiaque” breathing session.
gallery:
  - src: work/holivia/video-call.webp
    alt: Holivia mobile app during a video call with a therapist, with camera, microphone, chat and hang-up controls.
    caption: Video calls with a therapist — familiar controls, a calmer setting.
  - src: work/holivia/audio-player.webp
    alt: Audio player for a "Cohérence cardiaque" breathing session, with a soft animated play button, clouds and a progress bar.
    caption: The audio player for guided sessions. The animations follow the relaxing pace of the content.
  - src: work/holivia/home-expert-call.webp
    alt: Home screen with a recommended psychologist, available time slots, and a video call continuing in a floating picture-in-picture window.
    caption: The call keeps running in picture-in-picture while the user browses.
  - src: work/holivia/expert-profile.webp
    alt: Recommended psychologist card with specialties as tags and bookable time slots.
    caption: Booking a session with a recommended expert.
  - src: work/holivia/questionnaire-results.webp
    alt: Wellbeing questionnaire results as horizontal bars per topic, with a personal goal and a button to start a programme.
    caption: Questionnaire results leading to a personal programme.
links:
  - label: holivia.fr
    url: https://holivia.fr/
---

## Context

Holivia is a mental-health company: its app offers guided sound sessions
(meditation and similar) and lets people talk with a therapist by video. For a
product like this, the interface has to feel calm and dependable — a stuttering
player or a flaky call is not a small bug.

## What I did

- **Designed and rebuilt the whole frontend** of the Rails application. The
  design was mine, taking the good ideas of tools people already know — Google
  Meet, Zoom — and adapting them to a calmer, more personal context.
- **Set up a testing strategy**: unit tests and feature tests covering the main
  features, so the redesign could ship without regressions.
- **Built the video-call experience** people use to speak with their therapist,
  including a picture-in-picture mode that keeps the call alive while they move
  around the app.
- **Designed and built the audio player** for guided sessions, in vanilla
  JavaScript, CSS and HTML. I spent a lot of time on the animations, so that
  the player moves at the same relaxing pace as the content.
