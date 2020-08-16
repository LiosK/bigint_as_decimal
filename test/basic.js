const assert = require("assert").strict;
const { BigIntAsDecimal } = require("..");

describe("Basic methods", () => {
  describe("BigIntAsDecimal.isInteger()", () => {
    it("should produce the same results as manually prepared cases", () => {
      assert.ok(BigIntAsDecimal.isInteger(12345000n, 6));
      assert.ok(BigIntAsDecimal.isInteger(12345000n, 3));
      assert.ok(BigIntAsDecimal.isInteger(12345000n, 0));
      assert.ok(BigIntAsDecimal.isInteger(12345000n, -1));
      assert.ok(BigIntAsDecimal.isInteger(12345000n, -2));
      assert.ok(BigIntAsDecimal.isInteger(12345000n, -3));
      assert.ok(!BigIntAsDecimal.isInteger(12345000n, -4));
      assert.ok(!BigIntAsDecimal.isInteger(12345000n, -5));
      assert.ok(!BigIntAsDecimal.isInteger(12345000n, -6));
    });
  });
});

// vim: fdm=marker fmr&
