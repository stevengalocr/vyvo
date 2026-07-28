import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const baseUrl = "http://localhost:3000";
const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const routes = [
  "/",
  "/catalogo",
  "/producto/vyvo-core",
  "/personalizar",
  "/drops",
  "/carrito",
  "/checkout",
];

await mkdir("artifacts", { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
});

const results = [];

async function inspectRoute(context, route, label) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  const state = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    bodyLength: document.body.innerText.trim().length,
    hasOverlay: Boolean(
      document.querySelector(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
      ),
    ),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    links: document.querySelectorAll("a").length,
  }));

  results.push({
    label,
    route,
    status: response?.status() ?? null,
    ...state,
    consoleErrors,
    pageErrors,
    failedResponses,
  });

  if (["/", "/catalogo", "/personalizar", "/drops"].includes(route)) {
    const slug = route === "/" ? "home" : route.slice(1);
    await page.screenshot({
      path: `artifacts/vyvo-${slug}-${label}.png`,
      fullPage: false,
    });
  }

  await page.close();
}

async function verifyPrimaryJourneys(context) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/catalogo`, { waitUntil: "networkidle" });
  const navigationLabels = await page
    .locator(".desktop-nav > a")
    .allTextContents();
  await page.getByLabel("Buscar en el catálogo").fill("NEXO");
  const catalogSearchCount = await page.locator(".product-card").count();
  const catalogSearchName = await page
    .locator(".product-card h3")
    .first()
    .textContent();

  await page.goto(`${baseUrl}/personalizar`, { waitUntil: "networkidle" });
  const customizationPathCount = await page
    .locator(".customize-path-grid .customize-path")
    .count();
  await page
    .locator(".customize-path-grid")
    .getByRole("link", { name: "Explorar SHIFT" })
    .click();
  await page.waitForURL("**/producto/vyvo-shift");
  const personalizationDestination = page.url();

  await page.goto(`${baseUrl}/drops`, { waitUntil: "networkidle" });
  const dropStatusCount = await page.locator(".drop-status__grid > div").count();
  const dropPurchaseVisible = await page
    .getByRole("button", { name: "Agregar al carrito" })
    .isVisible();

  results.push({
    label: "primary-journeys",
    navigationLabels,
    catalogSearchCount,
    catalogSearchName: catalogSearchName?.trim() ?? null,
    customizationPathCount,
    personalizationDestination,
    dropStatusCount,
    dropPurchaseVisible,
    consoleErrors,
    pageErrors,
    failedResponses,
  });

  await page.close();
}

async function verifyPurchaseFlow(context, label) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/producto/vyvo-core`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Ver carrito" }).click();
  await page.waitForURL("**/carrito");

  const cartTotal = await page
    .locator(".order-summary__total dd")
    .textContent();
  await page.screenshot({
    path: `artifacts/vyvo-cart-${label}.png`,
    fullPage: false,
  });

  await page
    .getByRole("link", { name: "Continuar al checkout" })
    .click();
  await page.waitForURL("**/checkout");

  await page.getByLabel("Correo electrónico").fill("cliente@vyvo.demo");
  await page.getByLabel("Nombre").fill("Cliente");
  await page.getByLabel("Apellidos").fill("VYVO");
  await page.getByLabel("Teléfono").fill("+506 8888 8888");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Dirección").fill("Dirección de demostración");
  await page.getByLabel("Provincia").selectOption("San José");
  await page.getByLabel("Cantón o ciudad").fill("San José");
  await page.getByLabel("Código postal").fill("10101");
  await page.getByRole("button", { name: "Continuar" }).click();

  const paymentDemoVisible = await page
    .getByText("Pago seguro · modo demostración")
    .isVisible();
  await page.screenshot({
    path: `artifacts/vyvo-checkout-${label}.png`,
    fullPage: false,
  });

  await page
    .getByRole("button", { name: "Finalizar pedido de prueba" })
    .click();
  await page.waitForURL("**/checkout/confirmacion?pedido=VYVO-DEMO-*");

  const confirmationVisible = await page
    .getByRole("heading", {
      name: "La experiencia de compra está lista.",
    })
    .isVisible();
  const confirmationUrl = page.url();
  await page.screenshot({
    path: `artifacts/vyvo-confirmation-${label}.png`,
    fullPage: false,
  });

  results.push({
    label: `purchase-flow-${label}`,
    cartTotal,
    paymentDemoVisible,
    confirmationVisible,
    confirmationUrl,
    consoleErrors,
    pageErrors,
    failedResponses,
  });

  await page.close();
}

const desktop = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  reducedMotion: "no-preference",
});

for (const route of routes) {
  await inspectRoute(desktop, route, "desktop");
}
await verifyPrimaryJourneys(desktop);
await verifyPurchaseFlow(desktop, "desktop");
await desktop.close();

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  colorScheme: "light",
  reducedMotion: "reduce",
});
for (const route of ["/", "/catalogo", "/personalizar", "/drops"]) {
  await inspectRoute(mobile, route, "mobile");
}
await verifyPurchaseFlow(mobile, "mobile");

const menuPage = await mobile.newPage();
await menuPage.goto(baseUrl, { waitUntil: "networkidle" });
const menu = menuPage.getByRole("button", { name: "Abrir menú" });
const menuVisible = await menu.isVisible();
if (menuVisible) await menu.click();
await menuPage.waitForTimeout(250);
const mobileNavVisible = await menuPage.locator("#mobile-navigation").isVisible();
const mobileNavLabels = await menuPage
  .locator("#mobile-navigation > a")
  .evaluateAll((links) =>
    links.map((link) => link.getAttribute("aria-label") ?? link.textContent?.trim()),
  );
const mobileNavState = await menuPage.locator("#mobile-navigation").evaluate((element) => ({
  className: element.className,
  visibility: getComputedStyle(element).visibility,
  opacity: getComputedStyle(element).opacity,
  display: getComputedStyle(element).display,
  ariaExpanded: document.querySelector(".menu-toggle")?.getAttribute("aria-expanded"),
}));
results.push({
  label: "mobile-menu",
  menuVisible,
  mobileNavVisible,
  mobileNavLabels,
  mobileNavState,
});
await menuPage.close();
await mobile.close();

await browser.close();

const failures = results.filter((result) => {
  if (result.label === "mobile-menu") {
    return (
      !result.menuVisible ||
      !result.mobileNavVisible ||
      JSON.stringify(result.mobileNavLabels) !==
        JSON.stringify(["Catálogo", "Personalizar", "Drops"])
    );
  }
  if (result.label === "primary-journeys") {
    return (
      JSON.stringify(result.navigationLabels) !==
        JSON.stringify(["Catálogo", "Personalizar", "Drops"]) ||
      result.catalogSearchCount !== 1 ||
      result.catalogSearchName !== "NEXO" ||
      result.customizationPathCount !== 3 ||
      !result.personalizationDestination.endsWith("/producto/vyvo-shift") ||
      result.dropStatusCount !== 3 ||
      !result.dropPurchaseVisible ||
      result.consoleErrors.length > 0 ||
      result.pageErrors.length > 0 ||
      result.failedResponses.length > 0
    );
  }
  if (result.label.startsWith("purchase-flow-")) {
    return (
      !result.cartTotal ||
      !result.paymentDemoVisible ||
      !result.confirmationVisible ||
      result.consoleErrors.length > 0 ||
      result.pageErrors.length > 0 ||
      result.failedResponses.length > 0
    );
  }
  return (
    result.status !== 200 ||
    result.bodyLength === 0 ||
    result.hasOverlay ||
    result.horizontalOverflow ||
    result.consoleErrors.length > 0 ||
    result.pageErrors.length > 0 ||
    result.failedResponses.length > 0
  );
});

console.log(JSON.stringify({ results, failureCount: failures.length }, null, 2));
if (failures.length) process.exitCode = 1;
