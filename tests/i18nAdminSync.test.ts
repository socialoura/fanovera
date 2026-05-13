import { describe, expect, it } from "vitest";
import { appendLocaleTranslations, findMissingLocaleTranslations } from "../app/lib/i18nAdminSync";

const source = `
const en = {
  exact: {
    ...base.exact,
    "Suivi": "Tracking",
    "Commande confirmée": "Order confirmed",
  },
  fragments: [
    ["Une présence en ligne", "A clearer online presence"],
    ["sans promesses artificielles", "without artificial promises"],
  ]};

export default en;
`;

const target = `
const es = {
  exact: {
    ...en.exact,
    "Suivi": "Seguimiento",
  },
  fragments: [
    ["Une présence en ligne", "Una presencia online"],
  ]};

export default es;
`;

describe("i18n admin sync", () => {
  it("detects exact and fragment entries inherited from English", () => {
    const missing = findMissingLocaleTranslations(source, target, "es");

    expect(missing.exact.map((entry) => entry.source)).toEqual(["Commande confirmée"]);
    expect(missing.fragments.map((entry) => entry.source)).toEqual(["sans promesses artificielles"]);
  });

  it("appends generated translations to the locale file", () => {
    const next = appendLocaleTranslations(target, {
      exact: { "Commande confirmée": "Pedido confirmado" },
      fragments: { "sans promesses artificielles": "sin promesas artificiales" },
    });

    expect(next).toContain('"Commande confirmée": "Pedido confirmado"');
    expect(next).toContain('["sans promesses artificielles", "sin promesas artificiales"]');
  });
});
