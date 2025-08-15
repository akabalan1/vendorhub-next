// scripts/minTierCostCheck.ts
const assert = require("node:assert");

function calcMinTierCost(costTiers: {
  hourlyUsdMin: number | null;
  hourlyUsdMax: number | null;
}[]): number | null {
  return (
    costTiers
      .map((t) => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
      .filter((n) => n != null)
      .sort((a, b) => a - b)[0] ?? null
  );
}

const min = calcMinTierCost([
  { hourlyUsdMin: 0, hourlyUsdMax: null },
  { hourlyUsdMin: 5, hourlyUsdMax: 10 },
]);

assert.strictEqual(min, 0);

console.log("minTierCost preserved:", min);

