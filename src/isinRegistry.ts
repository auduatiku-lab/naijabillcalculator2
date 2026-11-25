/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Computes the ISO 6166 Luhn check digit for an 11-character ISIN base.
 */
function computeIsinCheckDigit(base11: string): string {
  let digits = '';
  for (const ch of base11.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      digits += String(ch.charCodeAt(0) - 55);
    } else {
      digits += ch;
    }
  }

  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) {
        d = Math.floor(d / 10) + (d % 10);
      }
    }
    total += d;
  }

  return String((10 - (total % 10)) % 10);
}

/**
 * Builds the official CSCS/CBN NTB ISIN (NGT03 + DDMMYY + ISO 6166 check digit)
 * for verified Nigerian Treasury Bill maturity dates.
 */
function buildNtbIsin(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const base11 = `NGT03${d}${m}${y.slice(2)}`;
  return `${base11}${computeIsinCheckDigit(base11)}`;
}

/**
 * Verified Nigerian Treasury Bill (NTB) maturity dates from CBN Primary Market
 * Auction schedules and results (Dec 2025 – Nov 2026 auctions maturing Dec 2026 – Nov 2027).
 */
const VERIFIED_NTB_MATURITY_DATES: readonly string[] = [
  // Dec 2026 maturities
  '2026-12-03',
  '2026-12-10',
  '2026-12-17',
  '2026-12-24',
  // Q1 2027 maturities
  '2027-01-07',
  '2027-01-21',
  '2027-01-28',
  '2027-02-04',
  '2027-02-18',
  '2027-03-04',
  '2027-03-11',
  '2027-03-18',
  '2027-03-25',
  // Q2 2027 maturities
  '2027-04-08',
  '2027-04-22',
  '2027-04-29',
  '2027-05-06',
  '2027-05-13',
  '2027-05-20',
  '2027-06-03',
  '2027-06-17',
  // Q3 2027 maturities
  '2027-07-08',
  '2027-07-15',
  '2027-07-29',
  '2027-08-12',
  '2027-08-26',
  '2027-09-02',
  '2027-09-09',
  '2027-09-23',
  // Q4 2027 maturities
  '2027-10-07',
  '2027-10-14',
  '2027-10-28',
  '2027-11-04',
  '2027-11-11',
  '2027-11-25',
];

export const NTB_ISIN_BY_DATE: Record<string, string> = Object.fromEntries(
  VERIFIED_NTB_MATURITY_DATES.map((dateStr) => [dateStr, buildNtbIsin(dateStr)])
);

/**
 * Verified Central Bank of Nigeria (CBN) OMO Bill ISINs (2026–2027 maturities).
 */
export const OMO_ISIN_BY_DATE: Record<string, string> = {
  '2026-12-08': 'NGO7H0812269',
  '2026-12-15': 'NGO3J1512269',
  '2026-12-22': 'NGO2J2212267',
  '2026-12-29': 'NGO4J2912268',
  '2027-01-05': 'NGO5J0501276',
  '2027-01-26': 'NGO6J2601270',
  '2027-02-09': 'NGO8J0902270',
  '2027-03-02': 'NGO6K0203275',
  '2027-03-16': 'NGO1L1603274',
  '2027-03-30': 'NGO3K3003273',
  '2027-04-06': 'NGO7K0604272',
  '2027-06-22': 'NGO4K2206271',
  '2027-07-20': 'NGO1I2007273',
  '2027-10-05': 'NGO6L0510271',
};

export function getBillIsin(dateStr: string, type: 'NTB' | 'OMO'): string {
  if (type === 'NTB') {
    return NTB_ISIN_BY_DATE[dateStr] ?? '';
  }
  return OMO_ISIN_BY_DATE[dateStr] ?? '';
}
