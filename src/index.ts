import { RoundingDivision, RoundingModes } from "./rounding";

/** Represent a decimal number as `coef * 10 ** exp`. */
export class BigIntAsDecimal {
  /**
   * Lightweight constructor without any validation. Use
   * [[BigIntAsDecimal.create]] for normal purposes.
   *
   * @param coef - Signed coefficient.
   * @param exp - Decimal exponent.
   */
  constructor(public coef: bigint, public exp: number) {}

  /**
   * Standard constructor to create a [[BigIntAsDecimal]] instance.
   *
   * This constructor accepts either a single argument `(x)` or a pair of
   * arguments `(x, exp)` and returns an instance representing `x` in the former
   * case by deriving the exponent from the fractional part of `x`, or that
   * representing `int(x) * 10 ** exp` in the latter case by interpreting the
   * arguments as a pair of integer coefficient and decimal exponent. Note that
   * this constructor throws an error if `x` is a non-numeric string; use
   * [[BigIntAsDecimal.parse]] instead for fallible string parsing.
   * @param x - Arbitrary numeric value when `exp` is not passed or integer
   * value when `exp` is passed.
   * @param exp - Decimal exponent.
   * @returns A [[BigIntAsDecimal]] representing `x` when `exp` is not passed or
   * `int(x) * 10 ** exp` when `exp` is passed.
   */
  static create(
    x: BigIntAsDecimal | bigint | number | string,
    exp?: number
  ): BigIntAsDecimal {
    if (exp == null) {
      // Derive exp from x
      if (x instanceof BigIntAsDecimal) {
        return new BigIntAsDecimal(x.coef, x.exp);
      } else if (typeof x === "bigint") {
        return new BigIntAsDecimal(x, 0);
      } else if (typeof x === "number") {
        if (Number.isInteger(x)) {
          return new BigIntAsDecimal(BigInt(x), 0);
        }
        // Go to the bottom
      }
    } else {
      // Cast x into int and return `x * 10 ** exp`
      checkExp(exp);
      if (x instanceof BigIntAsDecimal) {
        if (!BigIntAsDecimal.isInteger(x.coef, x.exp)) {
          throw new TypeError("'x' should be an integer when 'exp' is passed");
        }
        x = scaleCoefSafe(x.coef, x.exp, 0);
      } else if (typeof x === "number") {
        if (!Number.isInteger(x)) {
          throw new TypeError("'x' should be an integer when 'exp' is passed");
        }
        x = BigInt(x);
      }
      if (typeof x === "bigint") {
        return new BigIntAsDecimal(x, exp);
      }
    }

    // Trap fractional number and string
    const parsed = BigIntAsDecimal.parse(String(x), exp);
    if (parsed != null) {
      return parsed;
    } else {
      throw new SyntaxError(`Cannot convert '${x}' to a BigIntAsDecimal`);
    }
  }

  /**
   * Create BigIntAsDecimal from string.
   *
   * @param x - Arbitrary numeric string when `exp` is not passed or integer
   * string when `exp` is passed.
   * @returns A [[BigIntAsDecimal]] representing `x` when `exp` is not passed, a
   * [[BigIntAsDecimal]] representing `int(x) * 10 ** exp` when `exp` is passed,
   * or `null` if `x` can not be parsed as a number.
   */
  static parse(x: string, exp?: number): BigIntAsDecimal | null {
    if (exp != null) {
      checkExp(exp);
    }

    const m = x
      .trim()
      .match(/^([+-]?)([0-9]+|[0-9]*\.([0-9]+))(?:e([+-]?[0-9]+))?$/i);
    if (m == null) {
      return null;
    } else {
      const sign = m[1] === "-" ? "-" : "";
      const coef = BigInt(`${sign}${m[2].replace(".", "")}`);
      const lenFrac = m[3] == null ? 0 : m[3].length;
      const expCoded = (m[4] == null ? 0 : Number.parseInt(m[4])) - lenFrac;
      if (exp == null) {
        return new BigIntAsDecimal(coef, expCoded);
      } else {
        if (!BigIntAsDecimal.isInteger(coef, expCoded)) {
          throw new TypeError("'x' should be an integer when 'exp' is passed");
        }
        return new BigIntAsDecimal(scaleCoefSafe(coef, expCoded, 0), exp);
      }
    }
  }

  clone(): BigIntAsDecimal {
    return new BigIntAsDecimal(this.coef, this.exp);
  }

  toString(): string {
    return BigIntAsDecimal.stringify(this.coef, this.exp);
  }

  toLocaleString(
    locales?: string | string[],
    options?: SupportedNumberFormatOptions
  ): string {
    return BigIntAsDecimal.stringifyLocale(
      this.coef,
      this.exp,
      locales,
      options
    );
  }

  isInteger(): boolean {
    return BigIntAsDecimal.isInteger(this.coef, this.exp);
  }

  setExp(
    expTo: number,
    rounding: RoundingDivision = BigIntAsDecimal.defaultRounding
  ): BigIntAsDecimal {
    checkExp(expTo);
    return new BigIntAsDecimal(
      BigIntAsDecimal.scaleCoef(this.coef, this.exp, expTo, rounding),
      expTo
    );
  }

  compareTo(yc: bigint, ye: number): number {
    const y = BigIntAsDecimal.create(yc, ye);
    return BigIntAsDecimal.compare(this.coef, this.exp, y.coef, y.exp);
  }

  add(yc: bigint, ye: number): BigIntAsDecimal {
    const y = BigIntAsDecimal.create(yc, ye);
    return BigIntAsDecimal.add(this.coef, this.exp, y.coef, y.exp);
  }

  subtract(yc: bigint, ye: number): BigIntAsDecimal {
    const y = BigIntAsDecimal.create(yc, ye);
    return BigIntAsDecimal.subtract(this.coef, this.exp, y.coef, y.exp);
  }

  multiply(yc: bigint, ye: number): BigIntAsDecimal {
    const y = BigIntAsDecimal.create(yc, ye);
    return BigIntAsDecimal.multiply(this.coef, this.exp, y.coef, y.exp);
  }

  divide(
    yc: bigint,
    ye: number,
    expOut: number = this.exp,
    rounding: RoundingDivision = BigIntAsDecimal.defaultRounding
  ): BigIntAsDecimal {
    const y = BigIntAsDecimal.create(yc, ye);
    checkExp(expOut);
    return BigIntAsDecimal.divide(
      this.coef,
      this.exp,
      y.coef,
      y.exp,
      expOut,
      rounding
    );
  }

  static stringify(coef: bigint, exp: number): string {
    if (exp >= 0) {
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
    // Verify options
    const opt = {
      notation: "standard",
      style: "decimal",
      ...options,
      minimumFractionDigits: -Math.min(0, exp),
    };
    if (opt.notation !== "standard") {
      throw new RangeError(
        `options.notation '${opt.notation}' is not supported`
      );
    }
    if (opt.style === "percent") {
      throw new RangeError("options.style 'percent' is not supported");
    }

    // Take care of easy ones: simply format as a BigInt
    if (coef === 0n || exp >= 0) {
      const nf = new Intl.NumberFormat(locales, opt);
      return nf.format(scaleCoefSafe(coef, exp, 0));
    }

    const div = 10n ** BigInt(-exp);
    const integer = coef / div;
    const fraction = coef % div;

    // Prepare template by formatting Decimal as Number
    const template = (() => {
      // Condense Decimal into #,###,##0.### to avoid overflow, while tricking plural rules
      const neg = coef < 0n;
      const ui = neg ? -integer : integer;
      let conI = ui % 10_000_000n;
      if (conI < 1_000_000n && ui >= 10_000_000n) {
        conI += 1_000_000n;
      }
      const uf = neg ? -fraction : fraction;
      let conF = uf % 1_000n;
      if (conF < 100n && uf >= 1_000n) {
        conF += 100n;
      }
      const conE = -Math.max(-3, exp);
      const num = Number.parseFloat(
        `${neg ? "-" : ""}${conI}.${String(conF).padStart(conE, "0")}`
      );

      return new Intl.NumberFormat(locales, {
        ...opt,
        minimumFractionDigits: conE,
        useGrouping: false,
      }).formatToParts(num);
    })();

    // Format integer part
    let bufferi = "";
    const nfi = new Intl.NumberFormat(locales, {
      ...opt,
      style: "decimal",
    });
    for (const e of nfi.formatToParts(integer)) {
      if (e.type === "integer" || e.type === "group") {
        bufferi += e.value;
      }
    }

    // Format fractional part
    let bufferf = "";
    const nff = new Intl.NumberFormat(locales, {
      ...opt,
      minimumIntegerDigits: -exp,
      useGrouping: false,
      style: "decimal",
    });
    for (const e of nff.formatToParts(fraction)) {
      if (e.type === "integer") {
        bufferf += e.value;
      }
    }

    // Plug the integer and fraction parts into the template
    let buffer = "";
    for (const e of template) {
      if (e.type === "integer") {
        buffer += bufferi;
      } else if (e.type === "fraction") {
        buffer += bufferf;
      } else {
        buffer += e.value;
      }
    }
    return buffer;
  }

  static isInteger(coef: bigint, exp: number): boolean {
    return exp >= 0 || coef % 10n ** BigInt(-exp) === 0n;
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

  static compare(xc: bigint, xe: number, yc: bigint, ye: number): number {
    const exp = Math.min(xe, ye);
    xc = scaleCoefSafe(xc, xe, exp);
    yc = scaleCoefSafe(yc, ye, exp);
    return xc === yc ? 0 : xc > yc ? 1 : -1;
  }

  /** Arithmetic addition. */
  static add(xc: bigint, xe: number, yc: bigint, ye: number): BigIntAsDecimal {
    const exp = Math.min(xe, ye);
    xc = scaleCoefSafe(xc, xe, exp);
    yc = scaleCoefSafe(yc, ye, exp);
    return new BigIntAsDecimal(xc + yc, exp);
  }

  /** Arithmetic subtraction. */
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

  /** Arithmetic multiplication. */
  static multiply(
    xc: bigint,
    xe: number,
    yc: bigint,
    ye: number
  ): BigIntAsDecimal {
    return new BigIntAsDecimal(xc * yc, xe + ye);
  }

  /** Arithmetic division. */
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
    if (expOut + ye > xe) {
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
    const div = 10n ** BigInt(expTo - exp);
    if (coef % div === 0n) {
      return coef / div;
    } else {
      throw new RangeError("'expTo' should be smaller to avoid rounding");
    }
  }
};

const checkExp = (exp: number) => {
  if (!Number.isSafeInteger(exp)) {
    throw new TypeError("exponent should be an integer");
  }
};

interface SupportedNumberFormatOptions
  extends Omit<
    Intl.NumberFormatOptions,
    "minimumSignificantDigits" | "maximumSignificantDigits"
  > {
  notation?: "standard";
  style?: "decimal" | "currency" | "unit";
}
