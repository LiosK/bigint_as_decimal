const assert = require("assert").strict;
const { BigIntAsDecimal } = require("..");

describe("BigIntAsDecimal.stringify*", () => {
  const createRandomDecimal = () => {
    const coef = Math.round((Math.random() - 0.5) * 0xffff);
    const exp = Math.round((Math.random() - 0.5) * 12) || 0;
    return [BigInt(coef), exp, coef * 10 ** exp];
  };

  describe("BigIntAsDecimal.stringify()", () => {
    it("should produce the same results as manually prepared cases", () => {
      const manualCases = [
        // {{{
        [1234n, 6, "1234000000"],
        [-1234n, 6, "-1234000000"],
        [1234n, 3, "1234000"],
        [-1234n, 3, "-1234000"],
        [1234n, 0, "1234"],
        [-1234n, 0, "-1234"],
        [1234n, -3, "1.234"],
        [-1234n, -3, "-1.234"],
        [1234n, -6, "0.001234"],
        [-1234n, -6, "-0.001234"],
        [7890n, 6, "7890000000"],
        [-7890n, 6, "-7890000000"],
        [7890n, 3, "7890000"],
        [-7890n, 3, "-7890000"],
        [7890n, 0, "7890"],
        [-7890n, 0, "-7890"],
        [7890n, -3, "7.890"],
        [-7890n, -3, "-7.890"],
        [7890n, -6, "0.007890"],
        [-7890n, -6, "-0.007890"],
        [0n, 6, "0"],
        [0n, 3, "0"],
        [0n, 0, "0"],
        [0n, -3, "0.000"],
        [0n, -6, "0.000000"],
        // }}}
      ];

      for (let e of manualCases) {
        assert.strictEqual(BigIntAsDecimal.stringify(e[0], e[1]), e[2]);
      }
    });

    it("should produce the same results as does Number-based implementation", () => {
      for (let i = 0; i < 1000; i++) {
        const [coef, exp, num] = createRandomDecimal();
        const actual = BigIntAsDecimal.stringify(coef, exp);
        assert.strictEqual(actual, num.toFixed(-Math.min(0, exp)));
      }
    });
  });
  describe("BigIntAsDecimal.stringifyLocale()", () => {
    const locales = [
      // {{{
      "en",
      "ru",
      "es",
      "tr",
      "fa",
      "fr",
      "de",
      "ja",
      "pt",
      "vi",
      "zh",
      "ar",
      "it",
      "pl",
      "id",
      "el",
      "nl",
      "ko",
      "th",
      "cs",
      "hi",
      // }}}
    ];

    const options = [
      // {{{
      { style: "currency", currency: "USD" },
      { style: "currency", currency: "EUR" },
      { style: "currency", currency: "JPY" },
      { style: "currency", currency: "GBP" },
      { style: "currency", currency: "AUD" },
      { style: "currency", currency: "CAD", currencySign: "accounting" },
      // { style: "unit", unit: "meter" }, // fails when formatting Arabic
      // }}}
    ];

    it("should produce the same results as does Number-based implementation", () => {
      for (let i = 0; i < 8; i++) {
        const [coef, exp, num] = createRandomDecimal();
        const optMinFrac = {
          minimumFractionDigits: -Math.min(0, exp),
        };
        const noParam = BigIntAsDecimal.stringifyLocale(coef, exp);
        assert.strictEqual(noParam, num.toLocaleString(void 0, optMinFrac));

        for (const l of locales) {
          for (const o of options) {
            const opt = { ...o, ...optMinFrac };
            const wParam = BigIntAsDecimal.stringifyLocale(coef, exp, l, opt);
            assert.strictEqual(wParam, num.toLocaleString(l, opt));
          }
        }
      }
    });
  });
});

// vim: fdm=marker fmr&
