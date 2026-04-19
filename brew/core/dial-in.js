import { allRatings, drinkLabel } from "./store.js";

const STARTER_GRIND = {
  espresso: 8,
  iced_americano: 12,
  iced_latte: 9,
  cappuccino: 9,
};

export function suggestForDrink(drinkType, bag) {
  const pool = allRatings().filter(
    (r) => r.drinkType === drinkType && r.grindSize != null && r.rating
  );

  const roast = bag?.roast || "";
  const origin = bag?.origin || "";

  const scopes = [
    {
      key: "roast_origin",
      label: roast && origin ? `for ${roast} ${origin}` : null,
      filter: (r) => roast && origin && r.bag.roast === roast && r.bag.origin === origin,
    },
    {
      key: "roast",
      label: roast ? `for your ${roast} roasts` : null,
      filter: (r) => roast && r.bag.roast === roast,
    },
    {
      key: "all",
      label: "across your ratings",
      filter: () => true,
    },
  ];

  for (const scope of scopes) {
    if (!scope.label) continue;
    const scoped = pool.filter(scope.filter);
    if (scoped.length >= 2) {
      const weighted = scoped.reduce((s, r) => s + r.grindSize * r.rating, 0);
      const totalR = scoped.reduce((s, r) => s + r.rating, 0);
      const grind = Math.round(weighted / totalR);
      const avgRating = totalR / scoped.length;
      return {
        grind,
        scope: scope.key,
        scopeLabel: scope.label,
        sampleSize: scoped.length,
        avgRating,
        drinkLabel: drinkLabel(drinkType),
        hasData: true,
      };
    }
  }

  return {
    grind: STARTER_GRIND[drinkType] ?? 10,
    scope: "starter",
    scopeLabel: "starting point",
    sampleSize: 0,
    avgRating: 0,
    drinkLabel: drinkLabel(drinkType),
    hasData: false,
  };
}
