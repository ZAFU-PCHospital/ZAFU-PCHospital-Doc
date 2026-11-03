(() => {
  const diagrams = Array.from(document.querySelectorAll("pre > code.language-mermaid"), (code) => {
    const container = document.createElement("div");
    container.className = "mermaid";
    const source = code.textContent;
    code.parentElement.replaceWith(container);
    return { container, source };
  });

  // 即使本页没有图表，也关闭 Mermaid 自带的自动渲染。
  mermaid.initialize({ startOnLoad: false });
  if (!diagrams.length) return;

  let theme;
  let rendering = Promise.resolve();
  const renderDiagrams = () => {
    const nextTheme = document.documentElement.matches(".coal, .navy, .ayu") ? "dark" : "default";
    if (nextTheme === theme) return;
    theme = nextTheme;

    // 串行处理主题切换，避免同一个图表被同时渲染。
    rendering = rendering.then(async () => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: nextTheme,
        fontFamily: getComputedStyle(document.body).fontFamily,
        flowchart: { useMaxWidth: false },
      });
      await document.fonts.ready;

      for (const { container, source } of diagrams) {
        container.removeAttribute("data-processed");
        container.textContent = source;
        try {
          await mermaid.run({ nodes: [container] });
        } catch (error) {
          // 语法错误时保留源码，其他图表继续渲染。
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          code.textContent = source;
          pre.append(code);
          container.replaceChildren(pre);
          console.error("Mermaid 图表渲染失败：", error);
        }
      }
    });
  };

  new MutationObserver(renderDiagrams).observe(document.documentElement, {
    attributeFilter: ["class"],
  });
  renderDiagrams();
})();
