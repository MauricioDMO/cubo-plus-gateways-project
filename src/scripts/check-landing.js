// Run as a browser-console snippet at localhost:3000, at desktop and mobile widths.
// No test dependencies. Returns a summary; a failed assertion throws an error.
(async () => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const cards = () => [...document.querySelectorAll("#property-results article")];
  const filters = [...document.querySelectorAll('[role="group"][aria-label="Filter properties by category"] button')];
  const selectFilter = async (label) => {
    const button = filters.find((item) => item.textContent.startsWith(label));
    assert(button, `Missing filter: ${label}`);
    button.click();
    await settle();
    assert(button.getAttribute("aria-pressed") === "true", `Filter not selected: ${label}`);
  };

  assert(document.querySelectorAll("h1").length === 1, "Expected one main heading");
  await selectFilter("All stays");
  assert(cards().length === 3, "All stays should show three featured properties");
  await selectFilter("Apartments");
  assert(cards().length === 2 && cards().every((card) => card.querySelector('a[aria-label^="Explore "] > span').textContent === "Apartments"), "Apartment filter returned wrong properties");
  await selectFilter("Villas");
  assert(cards().length === 1 && cards()[0].textContent.includes("Casa Jungla"), "Villa filter returned wrong properties");
  await selectFilter("All stays");

  const reviews = document.querySelector('section[aria-labelledby="testimonials-title"]');
  const author = () => reviews.querySelector('[aria-live="polite"] p').textContent;
  const reviewImages = {
    "Natasha Afana": "/getaways/zonset-amenities-12.jpg",
    "Nicholas Poli": "/getaways/zonset-amenities-11.jpg",
    "Emilo Bejot": "/getaways/zonset-amenities-2.jpg",
  };
  const checkReviewImage = async () => {
    const image = reviews.querySelector("img");
    image.scrollIntoView({ behavior: "instant", block: "center" });
    const source = new URL(image.src);
    assert((source.searchParams.get("url") || source.pathname) === reviewImages[author()], `Wrong image for ${author()}`);
    await image.decode();
    assert(image.naturalWidth > 0 && image.alt, `Review image missing or without alternative text: ${author()}`);
  };
  const dots = [...reviews.querySelectorAll('[role="group"][aria-label="Choose a guest review"] button')];
  const click = async (element) => { element.click(); await settle(); };
  const next = document.querySelector('[aria-label="Next guest review"]');
  const previous = document.querySelector('[aria-label="Previous guest review"]');
  await click(dots[0]);
  await checkReviewImage();
  assert(author() === "Natasha Afana", "First review missing");
  await click(next);
  await checkReviewImage();
  assert(author() === "Nicholas Poli", "Next review failed");
  await click(previous);
  await checkReviewImage();
  assert(author() === "Natasha Afana", "Previous review failed");
  await click(previous);
  await checkReviewImage();
  assert(author() === "Emilo Bejot", "Review wraparound failed");
  await click(next);
  await checkReviewImage();
  assert(author() === "Natasha Afana", "Forward wraparound failed");
  await click(dots[1]);
  await checkReviewImage();
  assert(author() === "Nicholas Poli" && dots[1].getAttribute("aria-pressed") === "true", "Review selector failed");
  await click(dots[2]);
  await checkReviewImage();
  assert(author() === "Emilo Bejot" && dots[2].getAttribute("aria-pressed") === "true", "Third review selector failed");
  await click(dots[0]);
  await checkReviewImage();

  const menu = document.querySelector('button[aria-controls="main-navigation"]');
  if (getComputedStyle(menu).display !== "none") {
    const navigation = document.getElementById("main-navigation");
    assert(getComputedStyle(navigation).display === "none", "Mobile navigation should start closed");
    await click(menu);
    assert(menu.getAttribute("aria-expanded") === "true" && getComputedStyle(navigation).display !== "none", "Mobile navigation did not open");
    navigation.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    assert(menu.getAttribute("aria-expanded") === "false" && document.activeElement === menu, "Escape should close navigation and return focus");
    await click(menu);
    await click(navigation.querySelector('a[href="#properties"]'));
    assert(menu.getAttribute("aria-expanded") === "false", "Navigation should close after selecting a link");
  }

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    assert(document.getElementById(link.hash.slice(1)), `Broken section link: ${link.hash}`);
  }
  for (let top = 0; top < document.body.scrollHeight; top += 600) {
    window.scrollTo({ top, behavior: "instant" });
    await settle();
  }
  await Promise.all([...document.images].map((image) => image.decode()));
  assert([...document.images].every((image) => image.naturalWidth > 0 && image.alt), "Image missing or without alternative text");
  assert(getComputedStyle(document.body).backgroundColor === "rgb(255, 255, 255)" && getComputedStyle(document.body).color === "rgba(15, 23, 39, 0.65)", "Brand stylesheet did not load");
  assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, "Horizontal overflow");
  window.scrollTo({ top: 0, behavior: "instant" });
  return { passed: true, viewport: document.documentElement.clientWidth, properties: cards().length, images: document.images.length, checks: "filters, reviews, wraparound, mobile menu, keyboard, anchors, images, CSS, overflow" };
})();
