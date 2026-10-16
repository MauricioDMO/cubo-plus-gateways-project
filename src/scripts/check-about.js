// Run as a browser-console snippet at /about, at desktop and mobile widths.
(async () => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await document.fonts.ready;
  assert(location.pathname === "/about", "Open /about before running this check");
  assert(document.title === "About Us | Getaways El Salvador", "About metadata missing");
  assert(document.querySelectorAll("h1").length === 1 && document.querySelector("h1").textContent === "About Us.", "About heading missing");
  const navigation = document.getElementById("main-navigation");
  assert(navigation.querySelectorAll('[aria-current="page"]').length === 1 && navigation.querySelector('[aria-current="page"]').getAttribute("href") === "/about", "Wrong active navigation item");
  for (const href of ["/", "/#properties", "/#journal"]) {
    assert(navigation.querySelector(`a[href="${href}"]`), `Missing home destination: ${href}`);
  }
  assert(document.querySelector('footer a[href="/about"]'), "Footer About link should stay local");
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    assert(document.getElementById(link.hash.slice(1)), `Broken section link: ${link.hash}`);
  }
  assert(document.querySelector('main').textContent.includes("Goodlife Real Estate Consulting") && document.querySelector('main').textContent.includes("more than five years"), "Source content missing");
  const toggle = document.querySelector('button[aria-controls="main-navigation"]');
  if (getComputedStyle(toggle).display !== "none") {
    assert(toggle.getAttribute("aria-expanded") === "false", "Mobile menu should start closed");
    toggle.click();
    await settle();
    assert(toggle.getAttribute("aria-expanded") === "true" && getComputedStyle(navigation).display !== "none", "Mobile menu did not open");
    navigation.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    assert(toggle.getAttribute("aria-expanded") === "false" && document.activeElement === toggle, "Escape should close menu and restore focus");
  }
  await Promise.all([...document.images].map((image) => image.decode()));
  assert([...document.images].every((image) => image.naturalWidth > 0 && image.alt), "Image missing or without alternative text");
  assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, "Horizontal overflow");
  return { passed: true, viewport: document.documentElement.clientWidth, checks: "metadata, content, active navigation, links, mobile menu, keyboard, images, overflow" };
})();
