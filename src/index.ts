export class BigIntAsDecimal {
  coef: bigint;
  exp: number;

  constructor(coef: bigint, exp: number) {
    this.coef = coef;
    this.exp = exp;
  }

  static scaleCoef(
    coef: bigint,
    expChange: number,
    rounding: Rounding = BigIntAsDecimal.defaultRounding
  ): bigint {
    if (expChange === 0) {
      return coef;
    } else if (expChange < 0) {
      return coef * 10n ** BigInt(-expChange);
    } else {
      return rounding(coef, 10n ** BigInt(expChange));
    }
  }

  static setExp(
    coef: bigint,
    exp: number,
    expTo: number,
    rounding: Rounding = BigIntAsDecimal.defaultRounding
  ): BigIntAsDecimal {
    return new BigIntAsDecimal(
      BigIntAsDecimal.scaleCoef(coef, expTo - exp, rounding),
      expTo
    );
  }

  static add(xc: bigint, xe: number, yc: bigint, ye: number): BigIntAsDecimal {
    const exp = Math.min(xe, ye);
    xc = BigIntAsDecimal.scaleCoef(xc, exp - xe);
    yc = BigIntAsDecimal.scaleCoef(yc, exp - ye);
    return new BigIntAsDecimal(xc + yc, exp);
  }

  static subtract(
    xc: bigint,
    xe: number,
    yc: bigint,
    ye: number
  ): BigIntAsDecimal {
    const exp = Math.min(xe, ye);
    xc = BigIntAsDecimal.scaleCoef(xc, exp - xe);
    yc = BigIntAsDecimal.scaleCoef(yc, exp - ye);
    return new BigIntAsDecimal(xc - yc, exp);
  }

  static multiply(
    xc: bigint,
    xe: number,
    yc: bigint,
    ye: number
  ): BigIntAsDecimal {
    return new BigIntAsDecimal(xc * yc, xe + ye);
  }

  static divide(
    xc: bigint,
    xe: number,
    yc: bigint,
    ye: number,
    rounding: Rounding = BigIntAsDecimal.defaultRounding
  ): BigIntAsDecimal {
    if (ye > 0) {
      yc = BigIntAsDecimal.scaleCoef(yc, -ye);
      ye = 0;
    }
    xc = BigIntAsDecimal.scaleCoef(xc, ye);
    return new BigIntAsDecimal(rounding(xc, yc), xe);
  }

  /** Rounding mode options for division operation. */
  static readonly ROUNDING = {
    /** Round half away from zero (default). */
    HALF_UP: (n: bigint, div: bigint): bigint => {
      const q = n / div;
      const r2 = n % div << 1n;
      return q + r2 / div;
    },
    /** Round half to even. */
    HALF_TO_EVEN: (n: bigint, div: bigint): bigint => {
      const q = n / div;
      const r2 = n % div << 1n;
      if ((q & 1n) === 0n && (r2 === div || r2 === -div)) {
        return q;
      } else {
        return q + r2 / div;
      }
    },
    /** Round away from zero. */
    UP: (n: bigint, div: bigint): bigint => {
      const q = n / div;
      const r = n % div;
      if (r === 0n) {
        return q;
      } else {
        const isQNegative = (n > 0n && div < 0n) || (n < 0n && div > 0n);
        return q + (isQNegative ? -1n : 1n);
      }
    },
    /** Round towards zero. */
    DOWN: (n: bigint, div: bigint): bigint => {
      return n / div;
    },
    /** Round towards plus inifinity. */
    TOWARD_POSITIVE_INFINITY: (n: bigint, div: bigint): bigint => {
      const q = n / div;
      const r = n % div;
      const isQNegative = (n > 0n && div < 0n) || (n < 0n && div > 0n);
      if (isQNegative || r === 0n) {
        return q;
      } else {
        return q + 1n;
      }
    },
    /** Round towards minus inifinity. */
    TOWARD_NEGATIVE_INFINITY: (n: bigint, div: bigint): bigint => {
      const q = n / div;
      const r = n % div;
      const isQNegative = (n > 0n && div < 0n) || (n < 0n && div > 0n);
      if (!isQNegative || r === 0n) {
        return q;
      } else {
        return q - 1n;
      }
    },
  };

  static defaultRounding: Rounding = BigIntAsDecimal.ROUNDING.HALF_UP;
}

interface Rounding {
  (n: bigint, div: bigint): bigint;
}
