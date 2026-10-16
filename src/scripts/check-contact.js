// Run as a browser-console snippet at /contact-us, at desktop and mobile widths.
// Prepares a draft only: does not open an email app, call, or send anything.
(async () => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await document.fonts.ready;
  // Next.js retains hidden routes after client navigation; inspect the active page only.
  const visible = (selector) => [...document.querySelectorAll(selector)].find((element) => element.checkVisibility());
  const main = visible("main");
  const header = visible("header");
  const footer = visible("footer");
  const navigation = header.querySelector("nav");
  assert(location.pathname === "/contact-us", "Open /contact-us before running this check");
  assert(document.title === "Contact Us | Getaways El Salvador", "Contact metadata missing");
  assert(main.querySelectorAll("h1").length === 1 && main.querySelector("h1").textContent === "Contact Us.", "Contact heading missing");
  assert(navigation.querySelector('[aria-current="page"]').getAttribute("href") === "/contact-us", "Wrong active navigation item");
  for (const area of [main, footer]) {
    assert(area.querySelector('a[href="tel:+50360627813"]').textContent.includes("+503 6062 7813"), `Phone missing in ${area.tagName}`);
  }
  assert(main.querySelector('a[href="mailto:getaways@goodlifeelsalvador.com"]'), "Direct email missing");
  assert(!document.querySelector('a[href="https://getawayselsalvador.com/contact-us/"]'), "Contact link should stay local");
  const form = main.querySelector('form[aria-labelledby="contact-form-title"]');
  assert(form.getAttribute("action") === "mailto:getaways@goodlifeelsalvador.com" && form.method === "post", "No-JavaScript fallback must not put personal data in website URLs");
  const name = form.elements.namedItem("name");
  const email = form.elements.namedItem("email");
  const message = form.elements.namedItem("message");
  const fill = (field, value) => {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  form.reset();
  fill(name, "");
  await settle();
  assert(!form.checkValidity() && name.required && email.required && !message.required, "Native required validation missing");
  assert([name, email, message].every((field) => field.labels.length > 0), "Fields need accessible labels");
  fill(name, "   ");
  assert(!name.checkValidity(), "Whitespace-only names must be rejected");
  fill(name, " Ana & María #1 ");
  fill(email, "not-an-email");
  assert(email.validity.typeMismatch && !form.checkValidity(), "Invalid email should be rejected");
  fill(email, "ana+travel@example.com");
  const text = "Surf & stay? #sun\n¡Hola! = +";
  fill(message, text);
  assert(form.checkValidity(), "Valid contact values rejected");
  form.requestSubmit();
  await settle();
  const draft = form.querySelector('a[href^="mailto:"]');
  assert(draft, "Email draft missing");
  const url = new URL(draft.href);
  assert(url.pathname === "getaways@goodlifeelsalvador.com", "Wrong email recipient");
  assert(url.searchParams.get("subject") === "Getaways inquiry from Ana & María #1", "Draft subject encoding failed");
  assert(url.searchParams.get("body") === `Name: Ana & María #1\r\nEmail: ana+travel@example.com\r\n\r\n${text}`, "Draft body encoding failed");
  assert(form.textContent.includes("Nothing is sent from this website."), "Email delivery limitation must be clear");
  fill(message, "");
  await settle();
  assert(!form.querySelector('a[href^="mailto:"]'), "Editing should discard stale draft links");
  form.requestSubmit();
  await settle();
  assert(form.querySelector('a[href^="mailto:"]'), "Message should be optional");
  form.reset();
  fill(name, "");
  await settle();
  const toggle = header.querySelector('button[aria-controls="main-navigation"]');
  if (getComputedStyle(toggle).display !== "none") {
    toggle.click();
    await settle();
    assert(toggle.getAttribute("aria-expanded") === "true" && getComputedStyle(navigation).display !== "none", "Mobile menu did not open");
    navigation.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    assert(toggle.getAttribute("aria-expanded") === "false" && document.activeElement === toggle, "Escape should close menu and restore focus");
  }
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    assert(document.getElementById(link.hash.slice(1)), `Broken section link: ${link.hash}`);
  }
  await Promise.all([...main.querySelectorAll("img")].map((image) => image.decode()));
  assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, "Horizontal overflow");
  return { passed: true, viewport: document.documentElement.clientWidth, checks: "phone, email, navigation, native validation, draft encoding, stale draft, optional message, labels, menu, images, overflow" };
})();
