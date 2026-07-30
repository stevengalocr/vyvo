import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const baseUrl = process.env.VYVO_BASE_URL ?? "http://localhost:3000";
const executablePath =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  const homeCopy = await page.locator("main").innerText();
  assert.doesNotMatch(homeCopy, /BilBildin/i);
  assert.doesNotMatch(homeCopy, /Próximo drop|cuando exista inventario/i);
  assert.equal(await page.locator(".waitlist-form").count(), 0);

  await page.goto(`${baseUrl}/drops`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  const dropsCopy = await page.locator("main").innerText();
  assert.doesNotMatch(dropsCopy, /Seguir el lanzamiento|fecha por confirmar/i);
  assert.equal(await page.locator(".waitlist-form, #alerta").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Agregar al carrito" }).count(),
    1,
  );

  await page.goto(`${baseUrl}/catalogo`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  const productCards = page.locator(".product-card");
  const productCardCount = await productCards.count();
  assert.ok(productCardCount > 0);
  for (let index = 0; index < productCardCount; index += 1) {
    assert.equal(await productCards.nth(index).locator("a").count(), 1);
  }

  await page.goto(`${baseUrl}/producto/vyvo-core`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  const purchaseBox = await page.locator(".purchase-panel").boundingBox();
  const secondaryMediaBox = await page
    .locator(".pdp-secondary-media, .pdp-gallery__missing")
    .boundingBox();
  assert.ok(purchaseBox);
  assert.ok(secondaryMediaBox);
  assert.ok(
    purchaseBox.y < secondaryMediaBox.y,
    "mobile purchase decision must appear before secondary media",
  );

  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Ver carrito" }).click();
  await page.waitForURL("**/carrito");
  assert.equal(
    await page
      .getByRole("button", { name: "Reducir cantidad de CORE" })
      .isDisabled(),
    true,
  );

  await page.getByRole("link", { name: "Continuar al checkout" }).click();
  await page.waitForURL("**/checkout");
  await page.locator(".checkout-form").waitFor({ state: "visible" });
  const stepOneFields = page.locator("input");
  const stepOneFieldCount = await stepOneFields.count();
  assert.ok(stepOneFieldCount > 0);
  for (let index = 0; index < stepOneFieldCount; index += 1) {
    assert.ok(await stepOneFields.nth(index).getAttribute("name"));
  }

  await page.getByLabel("Correo electrónico").fill("cliente@vyvo.test");
  await page.getByLabel("Nombre").fill("Cliente");
  await page.getByLabel("Apellidos").fill("VYVO");
  await page.getByLabel("Teléfono").fill("+506 8888 8888");
  await page.getByRole("button", { name: "Continuar" }).click();
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "LEGEND",
  );
} finally {
  await browser.close();
}
