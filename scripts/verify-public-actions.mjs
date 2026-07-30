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
} finally {
  await browser.close();
}
