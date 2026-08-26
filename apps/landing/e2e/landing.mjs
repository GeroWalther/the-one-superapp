/**
 * Landing page smoke test.
 *
 *   node e2e/landing.mjs                    # against http://localhost:5656
 *   BASE=https://theone-superapp.vercel.app node e2e/landing.mjs
 *
 * Lives in the repository rather than a scratch directory because that is the
 * only way it survives: two earlier versions of this suite were lost to /tmp
 * cleanup, which meant a layout change shipped with no regression coverage at
 * all.
 *
 * Deliberately narrow. It asserts the things that silently break when sections
 * are re-laid out — horizontal overflow, a section collapsing to nothing, the
 * apply flow no longer opening in place — rather than pinning exact pixels,
 * which would fail on every intentional design change.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:5656";

let failures = 0;
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`• PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

const browser = await chromium.launch();

/* --- layout holds at every breakpoint ------------------------------------ */
const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1440, height: 1000, name: "desktop" },
];

const SECTIONS = ["#audience", "#verticals", "#process", "#philosophy", "#apply"];

for (const { width, height, name } of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    }),
  );
  await page.waitForTimeout(1200);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${name}: no horizontal overflow`, overflow <= 1, `${overflow}px`);
  check(`${name}: no console or page errors`, errors.length === 0, errors[0] ?? "");

  for (const selector of SECTIONS) {
    const box = await page.locator(selector).boundingBox();
    check(
      `${name}: ${selector} has height`,
      Boolean(box) && box.height > 100,
      box ? `h=${Math.round(box.height)}` : "not rendered",
    );
  }

  await page.close();
}

/* --- the apply flow still opens in place --------------------------------- */
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

/* The two paths moved out of the hero into the audience section, which states
   what each side gets and what it costs before asking anyone to apply. */
check(
  "audience section offers both paths",
  (await page.locator('#audience a[href*="#apply"]').count()) >= 2,
);
check(
  "both prices are stated before the form",
  (await page.locator("#audience").innerText()).includes("€49") &&
    /€5[.,]000/.test(await page.locator("#audience").innerText()),
);

const urlBefore = page.url();
await page.getByRole("button", { name: /Bewerbung starten/i }).first().click();
await page.waitForSelector('input[name="fullName"]', { timeout: 20000 });
check("member form opens without navigating", page.url().startsWith(urlBefore.split("#")[0]));
check("form uses the brand card", (await page.locator(".card-brand").count()) > 0);

await page.getByRole("button", { name: /Anderen Weg wählen/i }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: /Bewerbung starten/i }).last().click();
await page.waitForSelector('input[name="companyName"]', { timeout: 20000 });
check("partner form opens in place", true);

/* --- German copy the client asked for ------------------------------------ */
const html = await page.content();
check("no 'beantragen' anywhere", !/beantrag/i.test(html));
check("client positioning statement present", html.includes("einzigartige SUPER APP"));
check("tagline present", html.includes("Qualität vor Quantität"));

await browser.close();

console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
