const assert = require("assert").strict;
const { BigIntAsDecimal } = require("..");

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
  // }}}
];

describe("BigIntAsDecimal to string conversion", () => {
  describe("BigIntAsDecimal.stringify()", () => {
    it("should return '0' when coef is zero", () => {
      assert.strictEqual(BigIntAsDecimal.stringify(0n, 0), "0");
      for (let i = 0; i < 1000; i++) {
        assert.strictEqual(
          BigIntAsDecimal.stringify(
            0n,
            Math.round((Math.random() - 0.5) * 0xff)
          ),
          "0"
        );
      }
      assert.strictEqual(BigIntAsDecimal.stringify(0n, -3), "0");
      assert.strictEqual(BigIntAsDecimal.stringify(0n, 3), "0");
    });

    it("should produce the same results as manually prepared cases", () => {
      for (let e of manualCases) {
        assert.strictEqual(BigIntAsDecimal.stringify(e[0], e[1]), e[2]);
      }
    });
  });
});

// vim: fdm=marker fmr&
