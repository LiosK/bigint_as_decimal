import { RoundingDivision, RoundingModes } from "./rounding";

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
      const neg = coef < 0;
      let conI = (neg ? -integer : integer) % 10_000_000n;
      if (conI === 0n && integer !== 0n) {
        conI = 1_000_000n;
      }
      let conF = (neg ? -fraction : fraction) % 1_000n;
      if (conF === 0n && fraction !== 0n) {
        conF = 100n;
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

    // Format fraction part
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
  style?: "decimal" | "currency" | "unit";
}
