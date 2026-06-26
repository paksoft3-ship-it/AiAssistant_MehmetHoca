# Native App Roadmap — Deferred Capabilities

This document records capabilities that **cannot be delivered reliably in a web
browser** and are therefore deferred to a future native application (Beta spec
§5 "P3 — Deferred Native Capabilities", §16, §28). The web beta does **not**
claim to provide these.

## Why these are not web features

Browser tabs are suspended in the background, microphone access is gated behind a
visible, foregrounded page, and the OS may stop JavaScript timers/recognition
when the screen locks. There is no reliable cross-browser way to keep a hot
microphone or wake-word engine running while the app is closed.

## Deferred to native

| Capability | Web status | Native plan |
|---|---|---|
| Always-on microphone while app is closed | ❌ Not possible | Foreground service (Android) / background audio entitlement (iOS, restricted) |
| Wake word while screen is locked | ❌ Unreliable | On-device wake-word engine (e.g. Porcupine) in a native service |
| Reliable background listening on iOS | ❌ Not possible | Native audio session; still subject to OS policy |
| Full car / head-unit integration | ❌ Out of scope | Android Auto / CarPlay media + voice templates |
| Native camera document reading (OCR) | ⚠️ Experimental only | Native camera + on-device OCR (see `CAMERA_OCR_ROADMAP.md` when added) |
| Permanent OS assistant behavior | ❌ Not possible | OS assistant intents / app actions |

## What the web beta does provide (honestly)

- **Hands-free mode** while the page is open and focused, with microphone permission.
- A **Standby interface** (`StandbyOverlay`) — a dimmed, low-distraction screen that
  keeps the page active. It explicitly states it only works while the page is open
  and may stop when backgrounded or locked.
- A configurable **assistant name / wake phrase** (`assistantPreferences`) and a
  centralized, multilingual **command map** (`features/assistant/services/commands.ts`),
  used by the in-page hands-free flow.

All related UI copy avoids claiming background/locked-screen operation.
