---
name: gsap-animation
description: GSAP 3.11+ animation for the web — core tweens, timelines, ScrollTrigger, Flip, SplitText, gsap.matchMedia(), autoAlpha, React/Vue/Svelte cleanup and GPU-friendly performance. Use when building or reviewing JavaScript animation, scroll-driven effects, pinned or horizontal scroll sections, text reveals, layout (FLIP) transitions, responsive or reduced-motion animation, or when the user asks for an animation library without naming one.
license: MIT
---

# GSAP Animation

This skill bundles the official GreenSock agent skills (`references/`) behind one entry point. Read this page first, then load only the reference files the task needs.

## Reference index

| File | Covers | Load when |
|------|--------|-----------|
| [core.md](references/core.md) | `gsap.to/from/fromTo/set`, vars, transform aliases, `autoAlpha`, stagger, easing, defaults, `gsap.matchMedia()` | Every GSAP task |
| [timeline.md](references/timeline.md) | `gsap.timeline()`, position parameter, labels, nesting, playback control | More than one step in sequence |
| [scrolltrigger.md](references/scrolltrigger.md) | Triggers, start/end, scrub, pin, batch, `containerAnimation`, refresh and cleanup | Anything tied to scroll |
| [plugins.md](references/plugins.md) | Flip, SplitText, ScrollToPlugin, ScrollSmoother, Draggable, Observer, DrawSVG, MorphSVG, MotionPath, CustomEase … | Any plugin |
| [performance.md](references/performance.md) | Transforms vs layout, `will-change`, `quickTo()`, batching, off-screen work | Jank, many elements, mouse followers |
| [react.md](references/react.md) | `useGSAP()`, refs, scope, `contextSafe`, SSR | React / Next.js |
| [frameworks.md](references/frameworks.md) | Vue 3, Nuxt, Svelte lifecycle and cleanup | Vue / Nuxt / Svelte |
| [utils.md](references/utils.md) | `clamp`, `mapRange`, `snap`, `wrap`, `toArray`, `random`, `pipe` … | Math or helper logic |

## Setup

- Install from the public package: `npm install gsap` (React: also `@gsap/react`). Every plugin — SplitText, MorphSVG, ScrollSmoother included — is free and ships in `gsap`. Never suggest a Club membership, auth token, `.npmrc` or private registry.
- CDN for plain HTML: load `gsap.min.js` plus each plugin file from a pinned version, e.g. `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js`.
- Register each plugin once, at module top level, before first use: `gsap.registerPlugin(ScrollTrigger, Flip, SplitText)`.

## Rules to apply every time

**Tweens**
- Animate transform aliases (`x`, `y`, `xPercent`, `scale`, `rotation`) and opacity. Never move things with `top`/`left`/`width`/`height` when a transform does the job.
- Fade with `autoAlpha`, not `opacity`: at `0` it also sets `visibility: hidden`, so invisible elements stop catching clicks.
- `gsap.from()` and `fromTo()` render their start state immediately. When several of them target the same property on the same element, set `immediateRender: false` on the later ones.
- Use built-in eases (`"power2.out"`, `"power3.inOut"`, `"expo.out"`, `"none"`); reach for CustomEase only for a curve you can't get otherwise.
- Store the returned tween or timeline whenever you need to pause, reverse or kill it.

**Timelines**
- Sequence with `gsap.timeline()` and the position parameter (`"<"`, `">"`, `"-=0.2"`, labels), never with chained `delay`s.
- Put shared `duration`/`ease` in `gsap.timeline({ defaults: { … } })`.

**ScrollTrigger**
- Attach `scrollTrigger` to a timeline or a top-level tween — never to a tween inside a timeline, and never nest a ScrollTriggered animation inside another timeline.
- Choose `scrub` (progress follows scroll) or `toggleActions` (play/reverse at thresholds), not both.
- Create triggers in page order, top to bottom; otherwise set `refreshPriority`.
- Call `ScrollTrigger.refresh()` after content, images or fonts change layout. Resize is handled for you.
- Fake horizontal scroll with `containerAnimation` needs `ease: "none"` on the horizontal tween.
- Remove `markers: true` before shipping.

**Flip** — `const state = Flip.getState(targets)` → change the DOM or classes → `Flip.from(state, { duration, ease, absolute, nested })`. Use it for reordering, filtering, grid ↔ list, expand/collapse.

**SplitText (3.13+)** — `SplitText.create(el, { type: "lines,words", mask: "lines", autoSplit: true, onSplit(self) { return gsap.from(self.lines, { yPercent: 100, stagger: 0.08 }); } })`.
- Split only the units you animate.
- With `autoSplit`, create the animation inside `onSplit()` and return it so re-splits stay in sync.
- Wait for fonts (`document.fonts.ready`) or use `autoSplit`; keep the default `aria: "auto"` so screen readers read the original text.
- Don't combine with `text-wrap: balance`.

**Responsive and reduced motion — `gsap.matchMedia()` (3.11+)**

```js
const mm = gsap.matchMedia();
mm.add(
  {
    isDesktop: "(min-width: 800px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { isDesktop, reduceMotion } = ctx.conditions;
    gsap.from(".hero-line", {
      yPercent: reduceMotion ? 0 : 100,
      autoAlpha: 0,
      duration: reduceMotion ? 0 : 0.8,
      stagger: isDesktop ? 0.08 : 0.04,
    });
  }
);
// teardown: mm.revert()
```

Everything created inside a handler reverts automatically when its query stops matching. Don't wrap `gsap.context()` inside `matchMedia` — it already creates one.

**Cleanup**
- React: `useGSAP(() => { … }, { scope: containerRef })`. Wrap event-handler animations in `contextSafe`.
- Vanilla or other frameworks: `const ctx = gsap.context(() => { … }, root)` and call `ctx.revert()` on teardown.
- Kill or pause animations that are off-screen or belong to unmounted views.

**GPU and performance**
- Use `will-change: transform` in CSS only on elements that actually animate, never on everything.
- Use `gsap.quickTo()` for values updated on every pointer move.
- Prefer one `stagger` over many tweens with manual delays.
- Test pins and scrubs on a low-end phone.

## Delivery checklist

- [ ] Plugins registered once, before use
- [ ] Only transforms, opacity or `autoAlpha` on hot paths
- [ ] Multi-step motion lives in a timeline with defaults
- [ ] ScrollTrigger only on top-level animations; no markers in production
- [ ] `prefers-reduced-motion` handled through `gsap.matchMedia()`
- [ ] Every animation reverts on unmount or route change (`useGSAP`, `gsap.context`, `mm.revert`)
- [ ] Content is readable and usable with JavaScript disabled or before the animation runs (no hidden-by-default content without a fallback)
