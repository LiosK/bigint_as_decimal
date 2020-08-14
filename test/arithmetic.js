const assert = require("assert").strict;
const { BigIntAsDecimal } = require("..");

describe("Arithmetic operations", () => {
  const createRandomDecimal = () => {
    const coef = Math.round((Math.random() - 0.5) * 0xffff);
    const exp = Math.round((Math.random() - 0.5) * 8) || 0;
    return [BigInt(coef), exp, coef * 10 ** exp];
  };

  const numberToDecimal = (num, exp) => {
    const strCoef =
      exp >= 0
        ? (num / 10 ** exp).toFixed(0)
        : num.toFixed(-exp).replace(".", "");
    return new BigIntAsDecimal(BigInt(strCoef), exp);
  };

  describe("BigIntAsDecimal.add()", () => {
    it("should produce the same results as manually prepared cases", () => {
      assert.deepStrictEqual(
        BigIntAsDecimal.add(12345n, -2, 6789n, -3),
        new BigIntAsDecimal(130239n, -3)
      );
    });

    it("should produce the same results as Number-based calculations", () => {
      for (let i = 0; i < 1000; i++) {
        const [xc, xe, xn] = createRandomDecimal();
        const [yc, ye, yn] = createRandomDecimal();
        assert.deepStrictEqual(
          BigIntAsDecimal.add(xc, xe, yc, ye),
          numberToDecimal(xn + yn, Math.min(xe, ye))
        );
      }
    });
  });
  describe("BigIntAsDecimal.subtract()", () => {
    it("should produce the same results as manually prepared cases", () => {
      assert.deepStrictEqual(
        BigIntAsDecimal.subtract(12345n, -2, 6789n, -3),
        new BigIntAsDecimal(116661n, -3)
      );
    });

    it("should produce the same results as Number-based calculations", () => {
      for (let i = 0; i < 1000; i++) {
        const [xc, xe, xn] = createRandomDecimal();
        const [yc, ye, yn] = createRandomDecimal();
        assert.deepStrictEqual(
          BigIntAsDecimal.subtract(xc, xe, yc, ye),
          numberToDecimal(xn - yn, Math.min(xe, ye))
        );
      }
    });
  });
  describe("BigIntAsDecimal.multiply()", () => {
    it("should produce the same results as manually prepared cases", () => {
      assert.deepStrictEqual(
        BigIntAsDecimal.multiply(12345n, -2, 6789n, -3),
        new BigIntAsDecimal(83810205n, -5)
      );
    });

    it("should produce the same results as Number-based calculations", () => {
      for (let i = 0; i < 1000; i++) {
        const [xc, xe, xn] = createRandomDecimal();
        const [yc, ye, yn] = createRandomDecimal();
        assert.deepStrictEqual(
          BigIntAsDecimal.multiply(xc, xe, yc, ye),
          numberToDecimal(xn * yn, xe + ye)
        );
      }
    });
  });
  describe("BigIntAsDecimal.divide()", () => {
    it("should produce the same results as manually prepared cases", () => {
      assert.deepStrictEqual(
        BigIntAsDecimal.divide(12345n, -2, 6789n, -3),
        new BigIntAsDecimal(1818n, -2)
      );
      assert.deepStrictEqual(
        BigIntAsDecimal.divide(12345n, -2, 6789n, -3, -10),
        new BigIntAsDecimal(181838267786n, -10)
      );
    });

    it("should produce the same results as Number-based calculations #1 without expOut", () => {
      for (let i = 0; i < 1000; i++) {
        const [xc, xe, xn] = createRandomDecimal();
        let [yc, ye, yn] = createRandomDecimal();
        while (yc === 0n) {
          [yc, ye, yn] = createRandomDecimal();
        }
        assert.deepStrictEqual(
          BigIntAsDecimal.divide(xc, xe, yc, ye),
          numberToDecimal(xn / yn, xe),
          `Tested operation: ${xc}e${xe} / ${yc}e${ye}. Verify expected and actual results. This test may fail as expected results are subject to roundoff errors.`
        );
      }
    });

    it("should produce the same results as Number-based calculations #2 with expOut", () => {
      for (let i = 0; i < 1000; i++) {
        const [xc, xe, xn] = createRandomDecimal();
        let [yc, ye, yn] = createRandomDecimal();
        while (yc === 0n) {
          [yc, ye, yn] = createRandomDecimal();
        }
        assert.deepStrictEqual(
          BigIntAsDecimal.divide(xc, xe, yc, ye, -5),
          numberToDecimal(xn / yn, -5),
          `Tested operation: ${xc}e${xe} / ${yc}e${ye}. Verify expected and actual results. This test may fail as expected results are subject to roundoff errors.`
        );
      }
    });
  });
});

// vim: fdm=marker fmr&
