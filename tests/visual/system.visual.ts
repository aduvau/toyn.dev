import { readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { contracts } from "../../src/system/contracts.ts";
import { contractId } from "../../src/system/schema.ts";

// Visual regression (ADR-0004): every contract on `/system`, in both themes, against committed
// baselines. The shot list comes from the contracts, like the other guardrails (ADR-0002).
// Update on purpose only: `bun run test:visual --update-snapshots`, then review the PNG diff.
const SCHEMES = ["light", "dark"] as const;
const shotName = (id: string, scheme: string) => `${id}-${scheme}.png`;

test("every baseline belongs to a contract", () => {
  // Playwright never deletes baselines, so a removed contract would leave its PNGs behind.
  // Only this platform's set is checked; another OS keeps its own (see ADR-0004).
  const expected = contracts.flatMap((c) =>
    SCHEMES.map((scheme) =>
      test.info().snapshotPath(shotName(contractId(c), scheme), { kind: "screenshot" }),
    ),
  );
  const dir = join(import.meta.dirname, "__screenshots__");
  const orphans = readdirSync(dir)
    .filter((file) => file.endsWith(`-${process.platform}.png`))
    .map((file) => join(dir, file))
    .filter((file) => !expected.includes(file));
  expect(orphans).toEqual([]);
});

for (const colorScheme of SCHEMES) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme });

    test("/system shows exactly one article per contract", async ({ page }) => {
      await page.goto("/system/");
      const ids = await page
        .locator("article.contract")
        .evaluateAll((articles) => articles.map((a) => a.id));
      expect(ids.sort()).toEqual(contracts.map(contractId).sort());
    });

    for (const contract of contracts) {
      const id = contractId(contract);
      test(contract.name, async ({ page }) => {
        await page.goto("/system/");
        await expect(page.locator(`#${id}`)).toHaveScreenshot(shotName(id, colorScheme));
      });
    }
  });
}
