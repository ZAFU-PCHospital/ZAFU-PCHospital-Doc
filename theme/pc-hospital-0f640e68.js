(() => {
  const siteThemeKey = "zafu-pchospital:theme-mode";
  // 只有官网内的 /handbook/ 与官网共享模式；独立部署由 mdBook 自行持久化。
  const hostedBySite = !!document.querySelector('[data-pc-hospital-theme-bootstrap="true"]');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const updateThemeColor = () => {
    const background = getComputedStyle(document.documentElement)
      .getPropertyValue("--pc-bg")
      .trim();
    if (background) themeColor?.setAttribute("content", background);
  };

  const labels = {
    "mdbook-theme-default_theme": "自动",
    "mdbook-theme-light": "浅色",
    "mdbook-theme-coal": "深色",
  };

  for (const [id, label] of Object.entries(labels)) {
    const button = document.getElementById(id);
    if (button) button.textContent = label;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#mdbook-theme-list .theme");
    if (!button || !hostedBySite) return;

    try {
      if (button.id === "mdbook-theme-default_theme") localStorage.removeItem(siteThemeKey);
      if (button.id === "mdbook-theme-light") localStorage.setItem(siteThemeKey, "normal");
      if (button.id === "mdbook-theme-coal") localStorage.setItem(siteThemeKey, "dark");
    } catch {
      // localStorage may be unavailable; mdBook's in-page switch still works.
    }
  });

  new MutationObserver(updateThemeColor).observe(document.documentElement, {
    attributeFilter: ["class"],
  });
  updateThemeColor();
})();
