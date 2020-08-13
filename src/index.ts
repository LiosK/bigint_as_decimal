/** Divide `n` by `div`, returning the quotient rounded in a specific manner. */
interface RoundingDivision {
  (n: bigint, div: bigint): bigint;
}

/** Rounding mode options implemented as RoundingDivision operations. */
const RoundingModes = {
  HALF_UP: (n: bigint, div: bigint): bigint => {
    const q = n / div;
    const r2 = (n % div) * 2n;
    return q + r2 / div;
  },
  HALF_TO_EVEN: (n: bigint, div: bigint): bigint => {
    const q = n / div;
    const r2 = (n % div) * 2n;
    // Round half up except when q is even and r is exactly 0.5
    if ((q & 1n) === 0n && (r2 === div || r2 === -div)) {
      return q;
    } else {
      return q + r2 / div;
    }
  },
  UP: (n: bigint, div: bigint): bigint => {
    const q = n / div;
    const r = n % div;
    if (r === 0n) {
      return q;
    } else {
      const sameSign = n > 0n === div > 0n;
      return q + (sameSign ? 1n : -1n);
    }
  },
  DOWN: (n: bigint, div: bigint): bigint => {
    return n / div;
  },
  TOWARD_POSITIVE_INFINITY: (n: bigint, div: bigint): bigint => {
    const q = n / div;
    const r = n % div;
    if (r === 0n) {
      return q;
    } else {
      const sameSign = n > 0n === div > 0n;
      return q + (sameSign ? 1n : 0n);
    }
  },
  TOWARD_NEGATIVE_INFINITY: (n: bigint, div: bigint): bigint => {
    const q = n / div;
    const r = n % div;
    if (r === 0n) {
      return q;
    } else {
      const sameSign = n > 0n === div > 0n;
      return q - (sameSign ? 0n : 1n);
    }
  },
};

/** Represent a decimal number as `coef * 10 ** exp`. */
export class BigIntAsDecimal {
  /** Signed coefficient. */
  coef: bigint;

  /** Exponent. */
  exp: number;

  constructor(coef: bigint, exp: number) {
    this.coef = coef;
    this.exp = exp;
  }

  static stringify(coef: bigint, exp: number): string {
    if (coef === 0n) {
      return "0";
    } else if (exp >= 0) {
      return scaleCoefSafe(coef, exp, 0).toString();
    } else {
      const sign = coef < 0 ? "-" : "";
      const digits = coef.toString().slice(coef < 0 ? 1 : 0);
      const integer = digits.slice(0, exp).padStart(1, "0");
      const fraction = digits.slice(exp).padStart(-exp, "0");
      return `${sign}${integer}.${fraction}`;
    }
  }

  /** Experimental. */
  static stringifyLocale(
    coef: bigint,
    exp: number,
    locales?: string | string[],
    options?: SupportedNumberFormatOptions
  ): string {
    if (coef === 0n) {
      const nf = new Intl.NumberFormat(locales, options);
      return nf.format(0n);
    } else if (exp >= 0) {
      const nf = new Intl.NumberFormat(locales, options);
      return nf.format(scaleCoefSafe(coef, exp, 0));
    } else {
      const div = 10n ** BigInt(-exp);

      // Format integer part
      const integer = coef / div;
      const opt: Intl.NumberFormatOptions = {
        ...options,
      };
      if (
        opt.minimumFractionDigits == null ||
        opt.minimumFractionDigits < -exp
      ) {
        opt.minimumFractionDigits = -exp;
      }
      const nf = new Intl.NumberFormat(locales, opt);
      const parts =
        coef > 0n || integer !== 0n
          ? nf.formatToParts(integer)
          : nf.formatToParts(-0.1); // to format as a negative number

      // Format fraction part
      const fraction = coef % div;
      const optf: Intl.NumberFormatOptions = {
        ...options,
        minimumIntegerDigits: -exp,
        useGrouping: false,
      };
      const nff = new Intl.NumberFormat(locales, optf);
      let bufferf = "";
      for (const e of nff.formatToParts(fraction)) {
        if (e.type === "integer") {
          bufferf += e.value;
        }
      }

      // Concat parts, replacing fraction part with bufferf
      let buffer = "";
      for (const e of parts) {
        if (e.type === "fraction") {
          buffer += bufferf;
        } else {
          buffer += e.value;
        }
      }
      return buffer;
    }
  }

  static scaleCoef(
    coef: bigint,
    exp: number,
    expTo: number,
    rounding: RoundingDivision = BigIntAsDecimal.defaultRounding
  ): bigint {
    return expTo > exp
      ? rounding(coef, 10n ** BigInt(expTo - exp))
      : scaleCoefSafe(coef, exp, expTo);
  }

  static add(xc: bigint, xe: number, yc: bigint, ye: number): BigIntAsDecimal {
    const exp = Math.min(xe, ye);
    xc = scaleCoefSafe(xc, xe, exp);
    yc = scaleCoefSafe(yc, ye, exp);
    return new BigIntAsDecimal(xc + yc, exp);
  }

  static subtract(
    xc: bigint,
    xe: number,
    yc: bigint,
    ye: number
  ): BigIntAsDecimal {
    const exp = Math.min(xe, ye);
    xc = scaleCoefSafe(xc, xe, exp);
    yc = scaleCoefSafe(yc, ye, exp);
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
    expOut: number = xe,
    rounding: RoundingDivision = BigIntAsDecimal.defaultRounding
  ): BigIntAsDecimal {
    if (ye > 0) {
      yc = scaleCoefSafe(yc, ye, 0);
      ye = 0;
    }
    if (expOut + ye - xe > 0) {
      throw new RangeError(
        "'expOut' should be <= xe - ye, or the result will be rounded twice"
      );
    } else {
      xc = scaleCoefSafe(xc, xe, expOut + ye);
      return new BigIntAsDecimal(rounding(xc, yc), expOut);
    }
  }

  static defaultRounding: RoundingDivision = RoundingModes.HALF_UP;

  /** Rounding mode: round half away from zero (default). */
  static readonly ROUND_HALF_UP: RoundingDivision = RoundingModes.HALF_UP;

  /** Rounding mode: round half to even. */
  static readonly ROUND_HALF_TO_EVEN: RoundingDivision =
    RoundingModes.HALF_TO_EVEN;

  /** Rounding mode: round away from zero. */
  static readonly ROUND_UP: RoundingDivision = RoundingModes.UP;

  /** Rounding mode: round towards zero. */
  static readonly ROUND_DOWN: RoundingDivision = RoundingModes.DOWN;

  /** Rounding mode: round towards plus inifinity. */
  static readonly ROUND_TOWARD_POSITIVE_INFINITY: RoundingDivision =
    RoundingModes.TOWARD_POSITIVE_INFINITY;

  /** Rounding mode: round towards minus inifinity. */
  static readonly ROUND_TOWARD_NEGATIVE_INFINITY: RoundingDivision =
    RoundingModes.TOWARD_NEGATIVE_INFINITY;
}

const scaleCoefSafe = (coef: bigint, exp: number, expTo: number): bigint => {
  if (expTo === exp) {
    return coef;
  } else if (expTo < exp) {
    return coef * 10n ** BigInt(exp - expTo);
  } else {
    throw new RangeError("'expTo' should be <= 'exp' to avoid rounding");
  }
};

interface SupportedNumberFormatOptions
  extends Omit<
    Intl.NumberFormatOptions,
    "minimumSignificantDigits" | "maximumSignificantDigits"
  > {
  notation?: "standard";
}
