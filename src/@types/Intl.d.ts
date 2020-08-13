declare namespace Intl {
  interface NumberFormatPart {
    type: string;
    value: string;
  }

  interface NumberFormat {
    format(value: bigint): string;
    formatToParts(value: number): NumberFormatPart[];
    formatToParts(value: bigint): NumberFormatPart[];
  }

  interface NumberFormatOptions {
    compactDisplay?: string;
    currencySign?: string;
    notation?: string;
    numberingSystem?: string;
    signDisplay?: string;
    unit?: string;
    unitDisplay?: string;
  }
}
