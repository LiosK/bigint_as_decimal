/** Divide `n` by `div`, returning the quotient rounded in a specific manner. */
export interface RoundingDivision {
  (n: bigint, div: bigint): bigint;
}

/** Rounding mode options implemented as RoundingDivision operations. */
export const RoundingModes = {
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
