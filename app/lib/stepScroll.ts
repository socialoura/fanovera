export function scrollToStepMain() {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    const target =
      document.querySelector<HTMLElement>("[data-step-main] .slide-in") ??
      document.querySelector<HTMLElement>("[data-step-main]");
    const top = target
      ? target.getBoundingClientRect().top + window.scrollY - 12
      : 0;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  });
}
