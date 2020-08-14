const assert = require("assert").strict;
const { BigIntAsDecimal } = require("..");

describe("BigIntAsDecimal.stringify*", () => {
  const createRandomDecimal = () => {
    const coef = Math.round((Math.random() - 0.5) * 0xffff);
    const exp = Math.round((Math.random() - 0.5) * 12) || 0;
    return [coef, exp, coef * 10 ** exp];
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
        const actual = BigIntAsDecimal.stringify(BigInt(coef), exp);
        assert.strictEqual(actual, num.toFixed(-Math.min(0, exp)));
      }
    });
  });
});

// vim: fdm=marker fmr&
