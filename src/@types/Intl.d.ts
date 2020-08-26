declare namespace Intl {
  interface NumberFormatPart {
    type: string;
    value: string;
  }

  interface NumberFormat {
    formatToParts(value: number): NumberFormatPart[];
    formatToParts(value: bigint): NumberFormatPart[];
  }

  interface NumberFormatOptions {
    compactDisplay?: string;
    currencySign?: string;
    numberingSystem?: string;
    signDisplay?: string;
  }
}
