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

const SECTIONS = ["#audience", "#verticals", "#process", "#philosophy"];

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

/* --- each card opens its own application page ---------------------------- */
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

check(
  "audience section offers both paths",
  (await page.locator("#audience a").count()) >= 2,
);

/* Price belongs on the application page, not the pitch. */
const landing = await page.evaluate(() => document.body.innerText);
check("no price on the landing page", !/€49|€5[.,]000/.test(landing));
check("no application form on the landing page", !landing.includes("Zwei Wege hinein"));

await page.locator("#audience a").first().click();
await page.waitForURL("**/enroll/member**", { timeout: 20000 });
await page.waitForSelector('input[name="fullName"]', { timeout: 20000 });
const memberPage = await page.evaluate(() => document.body.innerText);
check("member page carries its value points", memberPage.includes("POWER AI, die Sie kennt"));
check("member page states the price", memberPage.includes("€49"));
check("member page shows what happens next", memberPage.includes("Gepr\u00fcft"));

await page.goto(`${BASE}/de/enroll/partner`, { waitUntil: "networkidle" });
await page.waitForSelector('input[name="companyName"]', { timeout: 20000 });
const partnerPage = await page.evaluate(() => document.body.innerText);
check("partner page carries its value points", partnerPage.includes("Keine Werbung"));
check("partner page states the price", /€5[.,]000/.test(partnerPage));

/* --- German copy the client asked for ------------------------------------ */
const html = await page.content();
check("no 'beantragen' anywhere", !/beantrag/i.test(html));
check("client positioning statement present", html.includes("einzigartige SUPER APP"));
check("tagline present", html.includes("Qualität vor Quantität"));

await browser.close();

console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
