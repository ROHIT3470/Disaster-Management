import { animate, stagger } from "animejs";

export function animatePageEntrance(root = document) {
  if (typeof window === "undefined") return () => {};

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const page = root.querySelector?.(".animate-fade-in");
  if (!page || prefersReducedMotion) return () => {};

  const targets = [
    page,
    ...page.querySelectorAll(
      ":scope > .page-header-pro, :scope > .dashboard-command-strip, :scope > .threat-advisory-banner, :scope > .dash-card, :scope > .quick-actions-card, :scope > .hub-section, :scope > .hub-two-col-grid, :scope > .simulation-layout-grid, :scope > .ai-main",
    ),
  ];

  targets.forEach((target) => {
    target.style.willChange = "opacity, transform";
  });

  const animation = animate(targets, {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 600,
    delay: stagger(55),
    ease: "outCubic",
  });

  return () => {
    animation.cancel();
    targets.forEach((target) => {
      target.style.willChange = "";
    });
  };
}
