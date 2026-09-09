import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForSelector("text=Trial balance", { timeout: 10000 });
await page.screenshot({ path: "/tmp/insights-page.png", fullPage: true });

const bodyText = await page.textContent("body");
console.log("Has Balance integrity section:", bodyText.includes("Balance integrity"));
console.log("Has Trial balance section:", bodyText.includes("Trial balance"));
console.log("Has Activity by cost center section:", bodyText.includes("Activity by cost center"));
console.log("Has Top vendors section:", bodyText.includes("Top vendors"));
console.log("Has Top customers section:", bodyText.includes("Top customers"));
console.log("Shows 211 / 211 documents balance:", bodyText.includes("211") && bodyText.includes("documents balance"));

console.log("Console/page errors:", errors);
await browser.close();
