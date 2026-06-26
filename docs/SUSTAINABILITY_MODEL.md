# Sustainability Model (future)

EidosUs core — reading, source-linked notes, and export — is **free**, and
accessibility features are **never gated** (Beta spec §26, §27). This document
records *possible* future funding directions; none are implemented in the beta,
and no advertising SDK is integrated.

## Principles

- Core reading + note-taking stay free, forever.
- Accessibility mode is always free and never ad-gated.
- No intrusive ads; no pyramid/referral rewards.
- Any AI quota limits must degrade gracefully (local reading/notes keep working).

## Options to evaluate later

- **Grants & university/institutional sponsorship** for an academic open-source tool.
- **Donations** (e.g. GitHub Sponsors / Open Collective).
- **Optional hosted premium** services (managed AI quota, cloud sync) — opt-in,
  never required for core use.
- **Non-intrusive sponsorship** (e.g. a single sponsor line), if ever.
- **Limited AI quotas** on the free tier with transparent messaging.

## Technical hook

A feature-entitlement abstraction exists today
(`src/features/entitlements/services/entitlements.ts`): in the beta every
feature resolves to `allowed: true` / `reason: 'free'`. A future quota- or
server-backed resolver can be swapped in without changing feature call sites,
and core/accessibility features remain in the always-free set.
