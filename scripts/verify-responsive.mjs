import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const baseUrl = process.env.VYVO_BASE_URL ?? "http://localhost:3000";
const executablePath =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDirectory = "artifacts/responsive";
const viewports = [
  { label: "mobile-375", width: 375, height: 812, touch: true },
  { label: "mobile-390", width: 390, height: 844, touch: true },
  { label: "tablet-768", width: 768, height: 1024, touch: true },
  { label: "compact-1024", width: 1024, height: 768, touch: false },
  { label: "desktop-1280", width: 1280, height: 800, touch: false },
  { label: "wide-1440", width: 1440, height: 900, touch: false },
];
const routes = [
  { path: "/", name: "home" },
  { path: "/catalogo", name: "catalogo" },
  { path: "/producto/vyvo-core", name: "producto" },
  { path: "/drops", name: "drops" },
];

await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const findings = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      isMobile: viewport.touch,
      hasTouch: viewport.touch,
      colorScheme: "light",
      reducedMotion: viewport.touch ? "reduce" : "no-preference",
    });

    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.locator("main").waitFor({ state: "visible" });
      await page.evaluate(() => document.fonts.ready);

      const result = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        };

        const undersizedButtons = [...document.querySelectorAll("button")]
          .filter(visible)
          .map((button) => {
            const rect = button.getBoundingClientRect();
            return {
              label:
                button.getAttribute("aria-label") ??
                button.textContent?.trim().replace(/\s+/g, " "),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })
          .filter(({ width, height }) => width < 44 || height < 44);

        return {
          horizontalOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          mainCount: document.querySelectorAll("main").length,
          h1Count: document.querySelectorAll("h1").length,
          missingImageAlt: [...document.querySelectorAll("img")].filter(
            (image) => !image.hasAttribute("alt"),
          ).length,
          unnamedButtons: [...document.querySelectorAll("button")]
            .filter(visible)
            .filter(
              (button) =>
                !button.getAttribute("aria-label") &&
                !button.textContent?.trim(),
            ).length,
          undersizedButtons,
          selectedHeroTabVisible: (() => {
            const selected = document.querySelector(
              '.hero-chips [aria-selected="true"]',
            );
            const strip = document.querySelector(".hero-chips");
            if (!selected || !strip) return true;
            const selectedRect = selected.getBoundingClientRect();
            const stripRect = strip.getBoundingClientRect();
            return (
              selectedRect.left >= stripRect.left - 1 &&
              selectedRect.right <= stripRect.right + 1
            );
          })(),
          purchaseDecisionOrder: (() => {
            const purchase = document.querySelector(".purchase-panel");
            const status = document.querySelector(".pdp-status");
            if (!purchase || !status) return true;
            return (
              purchase.getBoundingClientRect().top <
              status.getBoundingClientRect().top
            );
          })(),
          purchaseDecisionAboveFold: (() => {
            const purchase = document.querySelector(
              ".pdp-commerce .purchase-panel",
            );
            if (!purchase || window.innerWidth < 1280) return true;
            return purchase.getBoundingClientRect().top < window.innerHeight * 0.85;
          })(),
        };
      });

      const shouldCapture =
        route.name === "home" ||
        ((viewport.width === 390 || viewport.width === 1440) &&
          ["catalogo", "producto", "drops"].includes(route.name));
      if (shouldCapture) {
        await page.screenshot({
          path: `${artifactDirectory}/${route.name}-${viewport.label}.png`,
          fullPage: false,
          caret: "initial",
        });
      }

      findings.push({
        viewport: viewport.label,
        route: route.path,
        status: response?.status() ?? null,
        ...result,
        consoleErrors,
        pageErrors,
      });

      await page.close();
    }

    await context.close();
  }

  const motionContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "no-preference",
  });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await motionPage.locator(".hero").waitFor();

  const expectedProfiles = [
    ["CORE", "signal"],
    ["RUSH", "rush"],
    ["WILD", "ground"],
    ["SHIFT", "graphite"],
  ];
  for (const [label, expectedProfile] of expectedProfiles) {
    await motionPage.getByRole("tab", { name: new RegExp(label) }).click();
    await motionPage.waitForFunction(
      (profile) =>
        document
          .querySelector(".hero")
          ?.getAttribute("data-motion-profile") === profile,
      expectedProfile,
    );
    const motion = await motionPage.locator(".hero").evaluate((hero) => {
      const stage = hero.querySelector(".hero__stage-media--product");
      const style = stage ? getComputedStyle(stage) : null;
      return {
        profile: hero.getAttribute("data-motion-profile"),
        stageKey: stage?.getAttribute("data-stage-key") ?? null,
        animationName: style?.animationName ?? null,
        animationDuration: style?.animationDuration ?? null,
      };
    });
    assert.equal(motion.profile, expectedProfile);
    assert.ok(motion.stageKey);
    assert.notEqual(motion.animationName, "none");
    assert.match(motion.animationDuration ?? "", /^0\.(2|3)\d*s$/);
  }
  await motionContext.close();

  const failures = findings.filter(
    (finding) =>
      finding.status !== 200 ||
      finding.horizontalOverflow ||
      finding.mainCount !== 1 ||
      finding.h1Count !== 1 ||
      finding.missingImageAlt !== 0 ||
      finding.unnamedButtons !== 0 ||
      finding.undersizedButtons.length > 0 ||
      !finding.selectedHeroTabVisible ||
      !finding.purchaseDecisionOrder ||
      !finding.purchaseDecisionAboveFold ||
      finding.consoleErrors.length > 0 ||
      finding.pageErrors.length > 0,
  );

  console.log(
    JSON.stringify(
      {
        checkedViewportCount: viewports.length,
        checkedRouteCount: findings.length,
        failureCount: failures.length,
        failures,
      },
      null,
      2,
    ),
  );
  assert.equal(failures.length, 0);
} finally {
  await browser.close();
}
