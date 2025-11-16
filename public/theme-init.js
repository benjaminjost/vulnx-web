(function () {
  try {
    const storageKey = "vulnxTheme";
    const stored = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (error) {
    console.warn("Theme detection failed", error);
  }
})();
