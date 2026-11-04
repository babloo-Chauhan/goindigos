"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";
import Lenis from "lenis";

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function smoothScrollBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** Lower values coast for longer after the wheel stops. The library's default is 0.1. */
const SCROLL_GLIDE = 0.05;

/** Eases mouse-wheel scrolling so the page glides to a slow stop. Touch screens keep native scrolling, and reduced-motion visitors are left alone. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ autoRaf: true, allowNestedScroll: true, lerp: SCROLL_GLIDE });
    return () => lenis.destroy();
  }, []);
}

/** How far below the screen a section starts fading in, so nothing is still hidden when it scrolls into view. */
const REVEAL_AHEAD = "0px 0px 30% 0px";
const REVEAL_DURATION_MS = 380;
const REVEAL_STAGGER_MS = 40;
const REVEAL_MAX_STAGGERED = 4;

function clearRevealStyles(elements) {
  elements.forEach((element) => {
    element.style.opacity = "";
    element.style.transform = "";
  });
}

/** Fades new content in after moving between pages, without touching the first page load. Movement is dropped for reduced motion. */
export function usePageTransition(elementRef, pageKey) {
  const shownPage = useRef(pageKey);

  // Runs before the browser paints, so the new page never flashes at full opacity first.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || shownPage.current === pageKey) return undefined;
    shownPage.current = pageKey;
    const targets = [element];
    anime({
      targets: element,
      opacity: [0, 1],
      translateY: prefersReducedMotion() ? 0 : [12, 0],
      duration: 320,
      easing: "easeOutCubic",
      complete: () => clearRevealStyles(targets),
    });
    return () => {
      anime.remove(element);
      clearRevealStyles(targets);
    };
  }, [elementRef, pageKey]);
}

/** Staggers in [data-hero-reveal] children. CSS keeps them hidden until this runs, with a failsafe if it never does. */
export function useHeroEntrance(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    const targets = root.querySelectorAll("[data-hero-reveal]");
    anime({
      targets,
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(90, { start: 80 }),
      duration: 640,
      easing: "easeOutCubic",
    });
    return () => anime.remove(targets);
  }, [rootRef]);
}

/** Reveals [data-reveal] children on scroll, as a plain fade for reduced-motion visitors. Only elements still below the fold are hidden, and only once JS is running. */
export function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return undefined;
    const hiddenFrame = prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, transform: "translateY(14px)" };
    const shownFrame = prefersReducedMotion() ? { opacity: 1 } : { opacity: 1, transform: "none" };

    const targets = [...root.querySelectorAll("[data-reveal]")].filter(
      (element) => element.getBoundingClientRect().top > window.innerHeight * 0.92,
    );
    targets.forEach((element) => {
      element.style.opacity = "0";
    });

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      if (visible.length === 0) return;
      // The browser's own animations run off the main thread, so they cannot stutter the scroll.
      visible.forEach((element, index) => {
        observer.unobserve(element);
        element.style.opacity = "";
        element.animate([hiddenFrame, shownFrame], {
          duration: REVEAL_DURATION_MS,
          delay: Math.min(index, REVEAL_MAX_STAGGERED) * REVEAL_STAGGER_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        });
      });
    }, { rootMargin: REVEAL_AHEAD });
    targets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      clearRevealStyles(targets);
    };
  }, [rootRef]);
}

/** Counts up to the number already in the element when it scrolls into view. The HTML keeps the real value. */
export function useCountUp(elementRef, value) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !("IntersectionObserver" in window)) return undefined;
    const counter = { value: 0 };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      anime({
        targets: counter,
        value,
        round: 1,
        duration: 900,
        easing: "easeOutCubic",
        update: () => {
          element.textContent = String(counter.value);
        },
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      anime.remove(counter);
      element.textContent = String(value);
    };
  }, [elementRef, value]);
}

export function trackPointer(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
}

export function liftElement(element, distance) {
  if (!element || prefersReducedMotion()) return;
  anime.remove(element);
  anime({ targets: element, translateY: distance, duration: 220, easing: "easeOutCubic" });
}

export function shakeElement(element) {
  if (!element || prefersReducedMotion()) return;
  anime.remove(element);
  anime({
    targets: element,
    translateX: [0, -6, 6, -4, 4, 0],
    duration: 360,
    easing: "easeInOutSine",
    complete: () => {
      element.style.transform = "";
    },
  });
}

export function popInElement(element) {
  if (!element || prefersReducedMotion()) return;
  anime({ targets: element, opacity: [0, 1], scale: [0.97, 1], duration: 320, easing: "easeOutCubic" });
}

export function slideMenu(element, isOpen) {
  anime.remove(element);
  const duration = prefersReducedMotion() ? 0 : 220;
  if (isOpen) {
    element.hidden = false;
    anime({
      targets: element,
      height: [0, element.scrollHeight],
      opacity: [0, 1],
      duration,
      easing: "easeOutCubic",
      complete: () => {
        element.style.height = "auto";
      },
    });
    return;
  }
  anime({
    targets: element,
    height: [element.offsetHeight, 0],
    opacity: [1, 0],
    duration,
    easing: "easeInCubic",
    complete: () => {
      element.hidden = true;
    },
  });
}
