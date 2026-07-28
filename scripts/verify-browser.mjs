import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const baseUrl = "http://localhost:3000";
const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const routes = [
  "/",
  "/catalogo",
  "/producto/vyvo-core",
  "/personalizar",
  "/personalizar/vyvo-shift",
  "/personalizar/vyvo-arena",
  "/personalizar/vyvo-nexo",
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
    if (message.type() === "error") {
      consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    }
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
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    pendingReveals: document.querySelectorAll('[data-reveal-state="pending"]')
      .length,
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
    if (message.type() === "error") {
      consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/catalogo`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const navigationLabels = await page
    .locator(".desktop-nav > a")
    .allTextContents();
  await page.getByLabel("Buscar en el catálogo").fill("NEXO");
  await page.waitForFunction(
    () => document.querySelectorAll(".product-card").length === 1,
  );
  const catalogSearchCount = await page.locator(".product-card").count();
  const catalogSearchName = await page
    .locator(".product-card h3")
    .first()
    .textContent();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByRole("button", { name: "Personalizables" }).click();
  const customizableProductCount = await page.locator(".product-card").count();
  const catalogMotionHooks = {
    heroCopy: await page.locator(".page-hero__grid > [data-reveal]").count(),
    toolbar: await page.locator(".catalog-toolbar[data-reveal]").count(),
    activeSegmentPressed: await page
      .getByRole("button", { name: "Personalizables" })
      .getAttribute("aria-pressed"),
    resultAnnouncement: await page
      .locator(".catalog-results-heading [aria-live='polite']")
      .textContent(),
  };

  await page.goto(`${baseUrl}/personalizar`, { waitUntil: "networkidle" });
  const customizationPathCount = await page
    .locator(".customize-path-grid .customize-path")
    .count();
  await page
    .locator(".customize-path-grid")
    .getByRole("link", { name: "Configurar SHIFT" })
    .click();
  await page.waitForURL("**/personalizar/vyvo-shift");
  const personalizationDestination = page.url();
  const activePersonalizationNavigation = await page
    .locator('.desktop-nav a[aria-current="page"]')
    .textContent();
  const customizationStepBefore = await page
    .locator(".custom-builder__form fieldset")
    .evaluate((fieldset) => ({
      step: fieldset.getAttribute("data-step"),
      direction: fieldset.getAttribute("data-step-direction"),
    }));

  await page.getByLabel("La pieza es").selectOption({ label: "Para mí" });
  await page
    .getByLabel("Intención principal")
    .selectOption({ label: "Crear algo original" });
  await page
    .getByLabel("Historia esencial")
    .fill("Una pieza modular que represente movimiento y tecnología.");
  await page.getByRole("button", { name: "Continuar" }).click();
  const customizationStepAfter = await page
    .locator(".custom-builder__form fieldset")
    .evaluate((fieldset) => ({
      step: fieldset.getAttribute("data-step"),
      direction: fieldset.getAttribute("data-step-direction"),
    }));

  await page
    .getByLabel("Paleta principal")
    .selectOption({ label: "Negro + violeta" });
  await page
    .getByLabel("Módulo de identidad")
    .selectOption({ label: "Movimiento" });
  await page.getByLabel("Símbolo o inicial").fill("V");
  await page.getByLabel("Nombre corto").fill("VECTOR");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page
    .getByLabel(
      "Entiendo que es una configuración demostrativa, no una cotización ni una orden de producción.",
    )
    .check();
  await page
    .getByRole("button", { name: "Agregar configuración al carrito" })
    .click();
  const customizationConfirmationVisible = await page
    .getByRole("heading", {
      name: "Tu SHIFT ya tiene una dirección clara.",
    })
    .isVisible();
  await page.waitForFunction(() => {
    const stored = localStorage.getItem("vyvo:cart:v1");
    if (!stored) return false;
    try {
      return JSON.parse(stored).some((item) => item.configuration);
    } catch {
      return false;
    }
  });
  await page
    .getByRole("link", { name: "Ver configuración en carrito" })
    .click();
  await page.waitForURL("**/carrito");
  await page.getByText("SHIFT · VECTOR").waitFor();
  const configurationInCart = await page
    .getByText("SHIFT · VECTOR")
    .isVisible();
  const configurationDetailInCart = await page
    .getByText("Negro + violeta")
    .isVisible();

  await page.goto(`${baseUrl}/drops`, { waitUntil: "networkidle" });
  const dropStatusCount = await page.locator(".drop-status__grid > div").count();
  const dropMotionHooks = {
    depthLayers: await page.locator(".drops-hero__depth").count(),
    purchaseAnchor: await page.locator("#comprar").count(),
    alertAnchor: await page.locator("#alerta").count(),
  };
  const dropPurchaseVisible = await page
    .getByRole("button", { name: "Agregar al carrito" })
    .isVisible();
  await page.getByRole("link", { name: "Seguir el lanzamiento" }).click();
  const dropAlertAnchorReached = page.url().endsWith("/drops#alerta");
  await page.getByLabel("Correo electrónico").fill("alerta@vyvo.demo");
  await page
    .getByLabel(
      "Acepto recibir novedades de VYVO. Puedo retirar mi consentimiento cuando quiera.",
    )
    .check();
  const waitlistSubmitStateBefore = await page
    .locator("#alerta .waitlist-form")
    .getAttribute("data-submit-state");
  const waitlistResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/waitlist") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Unirme" }).click();
  const waitlistResponse = await waitlistResponsePromise;
  await page.getByText("El flujo está listo.").waitFor();
  const waitlistPreviewVisible = await page
    .getByText("El flujo está listo.")
    .isVisible();

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const clubSectionCount = await page.getByText("VYVO Club · Próximamente").count();
  const selectedBefore = await page
    .locator('.hero-chips [aria-selected="true"]')
    .textContent();
  const heroMotion = await page.locator(".hero").evaluate((hero) => ({
    state: hero.getAttribute("data-hero-state"),
    decorativeLayers: hero.querySelectorAll(
      '[aria-hidden="true"].hero__kinetic-layer',
    ).length,
    focusKey: hero
      .querySelector(".hero-focus__content")
      ?.getAttribute("data-focus-key"),
  }));
  const landingMotion = {
    revealCount: await page.locator("[data-reveal]").count(),
    productAccentCount: await page
      .locator(".origins-preview .product-card__accent")
      .count(),
  };
  await page.getByRole("button", { name: "Personaje siguiente" }).click();
  const selectedAfter = await page
    .locator('.hero-chips [aria-selected="true"]')
    .textContent();

  results.push({
    label: "primary-journeys",
    navigationLabels,
    catalogSearchCount,
    catalogSearchName: catalogSearchName?.trim() ?? null,
    customizableProductCount,
    catalogMotionHooks,
    customizationPathCount,
    personalizationDestination,
    activePersonalizationNavigation:
      activePersonalizationNavigation?.trim() ?? null,
    customizationStepBefore,
    customizationStepAfter,
    customizationConfirmationVisible,
    configurationInCart,
    configurationDetailInCart,
    dropStatusCount,
    dropMotionHooks,
    dropPurchaseVisible,
    dropAlertAnchorReached,
    waitlistStatus: waitlistResponse.status(),
    waitlistPreviewVisible,
    waitlistSubmitStateBefore,
    clubSectionCount,
    heroCarouselChanged: selectedBefore !== selectedAfter,
    heroMotion,
    landingMotion,
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
    if (message.type() === "error") {
      consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/producto/vyvo-core`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  const purchaseState = await page
    .locator(".purchase-panel")
    .getAttribute("data-purchase-state");
  await page.getByRole("link", { name: "Ver carrito" }).click();
  await page.waitForURL("**/carrito");
  const cartEmptyState = await page
    .locator(".cart-layout")
    .getAttribute("data-cart-empty");

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
  const checkoutStepStart = await page
    .locator(".checkout-layout")
    .getAttribute("data-checkout-step");

  await page.getByLabel("Correo electrónico").fill("cliente@vyvo.demo");
  await page.getByLabel("Nombre").fill("Cliente");
  await page.getByLabel("Apellidos").fill("VYVO");
  await page.getByLabel("Teléfono").fill("+506 8888 8888");
  await page.getByRole("button", { name: "Continuar" }).click();
  const checkoutStepDelivery = await page
    .locator(".checkout-layout")
    .getAttribute("data-checkout-step");

  await page.getByLabel("Dirección").fill("Dirección de demostración");
  await page.getByLabel("Provincia").selectOption("San José");
  await page.getByLabel("Cantón o ciudad").fill("San José");
  await page.getByLabel("Código postal").fill("10101");
  await page.getByRole("button", { name: "Continuar" }).click();

  const paymentDemoVisible = await page
    .getByText("Pago seguro · modo demostración")
    .isVisible();
  const checkoutStepReview = await page
    .locator(".checkout-layout")
    .getAttribute("data-checkout-step");
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
    purchaseState,
    cartEmptyState,
    checkoutStepStart,
    checkoutStepDelivery,
    checkoutStepReview,
    paymentDemoVisible,
    confirmationVisible,
    confirmationUrl,
    consoleErrors,
    pageErrors,
    failedResponses,
  });

  await page.close();
}

async function verifyInteractionIntegrity(context) {
  const page = await context.newPage();
  const routesToAudit = [
    "/",
    "/catalogo",
    "/personalizar",
    "/personalizar/vyvo-shift",
    "/personalizar/vyvo-arena",
    "/personalizar/vyvo-nexo",
    "/drops",
    "/carrito",
    "/checkout",
    "/cuidados",
    "/politicas",
    "/privacidad",
    "/terminos",
    "/colecciones/origins",
    ...[
      "vyvo-core",
      "vyvo-rush",
      "vyvo-wild",
      "vyvo-echo",
      "vyvo-shift",
      "vyvo-nova",
      "vyvo-arena",
      "vyvo-nexo",
      "vyvo-abyss",
    ].map((slug) => `/producto/${slug}`),
  ];
  const unnamedButtons = [];
  const formsWithoutSubmit = [];
  const deadHashes = [];
  const hrefs = new Set();

  for (const route of routesToAudit) {
    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    const audit = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      };
      return {
        unnamedButtons: [...document.querySelectorAll("button")]
          .filter(visible)
          .filter(
            (button) =>
              !(
                button.getAttribute("aria-label") ||
                button.textContent?.trim() ||
                button.getAttribute("title")
              ),
          ).length,
        formsWithoutSubmit: [...document.querySelectorAll("form")]
          .filter(visible)
          .filter(
            (form) =>
              !form.querySelector(
                'button[type="submit"], input[type="submit"]',
              ),
          ).length,
        links: [...document.querySelectorAll("a[href]")].map((anchor) => ({
          href: anchor.href,
          rawHref: anchor.getAttribute("href"),
        })),
      };
    });

    if (audit.unnamedButtons) {
      unnamedButtons.push(`${route}: ${audit.unnamedButtons}`);
    }
    if (audit.formsWithoutSubmit) {
      formsWithoutSubmit.push(`${route}: ${audit.formsWithoutSubmit}`);
    }
    for (const link of audit.links) {
      const url = new URL(link.href);
      if (url.origin !== baseUrl) continue;
      hrefs.add(`${url.pathname}${url.search}`);
      if (url.hash && url.pathname === new URL(page.url()).pathname) {
        const targetExists = await page.evaluate(
          (id) => Boolean(document.getElementById(id)),
          decodeURIComponent(url.hash.slice(1)),
        );
        if (!targetExists) deadHashes.push(`${route}: ${link.rawHref}`);
      }
    }
  }

  const brokenLinks = [];
  for (const href of hrefs) {
    const response = await context.request.get(`${baseUrl}${href}`);
    if (response.status() >= 400) {
      brokenLinks.push(`${response.status()} ${href}`);
    }
  }

  const clubRedirect = await context.request.get(`${baseUrl}/club`, {
    maxRedirects: 0,
    timeout: 15_000,
  });
  results.push({
    label: "interaction-integrity",
    auditedRouteCount: routesToAudit.length,
    auditedLinkCount: hrefs.size,
    unnamedButtons,
    formsWithoutSubmit,
    deadHashes,
    brokenLinks,
    clubRedirectDestination: clubRedirect.headers().location ?? null,
    clubRedirectStatus: clubRedirect.status(),
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
await verifyInteractionIntegrity(desktop);
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
for (const route of [
  "/",
  "/catalogo",
  "/personalizar",
  "/personalizar/vyvo-nexo",
  "/drops",
]) {
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
      result.customizableProductCount !== 3 ||
      result.catalogMotionHooks.heroCopy !== 2 ||
      result.catalogMotionHooks.toolbar !== 1 ||
      result.catalogMotionHooks.activeSegmentPressed !== "true" ||
      !result.catalogMotionHooks.resultAnnouncement?.includes("3") ||
      result.customizationPathCount !== 3 ||
      !result.personalizationDestination.endsWith("/personalizar/vyvo-shift") ||
      result.activePersonalizationNavigation !== "Personalizar" ||
      result.customizationStepBefore.step !== "1" ||
      result.customizationStepAfter.step !== "2" ||
      result.customizationStepAfter.direction !== "forward" ||
      !result.customizationConfirmationVisible ||
      !result.configurationInCart ||
      !result.configurationDetailInCart ||
      result.dropStatusCount !== 3 ||
      result.dropMotionHooks.depthLayers !== 1 ||
      result.dropMotionHooks.purchaseAnchor !== 1 ||
      result.dropMotionHooks.alertAnchor !== 1 ||
      !result.dropPurchaseVisible ||
      !result.dropAlertAnchorReached ||
      result.waitlistStatus !== 202 ||
      !result.waitlistPreviewVisible ||
      result.waitlistSubmitStateBefore !== "idle" ||
      result.clubSectionCount !== 0 ||
      !result.heroCarouselChanged ||
      !result.heroMotion.state ||
      result.heroMotion.decorativeLayers !== 2 ||
      !result.heroMotion.focusKey ||
      result.landingMotion.revealCount < 12 ||
      result.landingMotion.productAccentCount !== 6 ||
      result.consoleErrors.length > 0 ||
      result.pageErrors.length > 0 ||
      result.failedResponses.length > 0
    );
  }
  if (result.label === "interaction-integrity") {
    return (
      result.unnamedButtons.length > 0 ||
      result.formsWithoutSubmit.length > 0 ||
      result.deadHashes.length > 0 ||
      result.brokenLinks.length > 0 ||
      result.clubRedirectDestination !== "/personalizar" ||
      result.clubRedirectStatus !== 308
    );
  }
  if (result.label.startsWith("purchase-flow-")) {
    return (
      !result.cartTotal ||
      result.purchaseState !== "added" ||
      result.cartEmptyState !== "false" ||
      result.checkoutStepStart !== "1" ||
      result.checkoutStepDelivery !== "2" ||
      result.checkoutStepReview !== "3" ||
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
    (result.reducedMotion && result.pendingReveals !== 0) ||
    result.consoleErrors.length > 0 ||
    result.pageErrors.length > 0 ||
    result.failedResponses.length > 0
  );
});

console.log(JSON.stringify({ results, failureCount: failures.length }, null, 2));
if (failures.length) process.exitCode = 1;
