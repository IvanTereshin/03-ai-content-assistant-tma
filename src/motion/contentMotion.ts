import gsap from 'gsap';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playStudioEntry(root: Element | null): void {
  if (!root || prefersReducedMotion()) {
    return;
  }

  const targets = Array.from(root.querySelectorAll('[data-studio-motion]'));
  if (targets.length === 0) {
    return;
  }

  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out', stagger: 0.06 },
  );
}

export function playResultReveal(root: Element | null): void {
  if (!root || prefersReducedMotion()) {
    return;
  }

  const targets = Array.from(root.querySelectorAll('[data-result-motion]'));
  if (targets.length === 0) {
    return;
  }

  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: 12, scale: 0.985 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out', stagger: 0.05 },
  );
}
