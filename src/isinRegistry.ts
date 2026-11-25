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
 * Builds the official CSCS/CBN NTB ISIN (`NGT` + tenorCode + `DDMMYY` + ISO 6166 check digit)
 * where tenorCode is `'01'` (91-day), `'02'` (182-day), or `'03'` (364-day).
 */
function buildNtbIsin(dateStr: string, tenorCode: '01' | '02' | '03'): string {
  const [y, m, d] = dateStr.split('-');
  const base11 = `NGT${tenorCode}${d}${m}${y.slice(2)}`;
  return `${base11}${computeIsinCheckDigit(base11)}`;
}

/**
 * Verified Nigerian Treasury Bill (NTB) maturity dates and benchmark tenor codes
 * (364-day `'03'` where issued, otherwise 182-day `'02'` or 91-day `'01'`),
 * cross-checked against CBN Primary Market Auction records and OpenFIGI/Bloomberg.
 */
const VERIFIED_NTB_ISSUES: ReadonlyArray<readonly [string, '01' | '02' | '03']> = [
  // Nov–Dec 2026 maturities
  ['2026-11-26', '01'],
  ['2026-12-03', '03'],
  ['2026-12-10', '03'],
  ['2026-12-17', '03'],
  ['2026-12-24', '01'],
  // Q1 2027 maturities
  ['2027-01-07', '03'],
  ['2027-01-14', '02'],
  ['2027-01-21', '03'],
  ['2027-01-28', '02'],
  ['2027-02-04', '03'],
  ['2027-02-11', '02'],
  ['2027-02-18', '03'],
  ['2027-02-25', '02'],
  ['2027-03-04', '03'],
  ['2027-03-11', '03'],
  ['2027-03-18', '03'],
  ['2027-03-25', '03'],
  // Q2 2027 maturities
  ['2027-04-08', '03'],
  ['2027-04-15', '02'],
  ['2027-04-22', '03'],
  ['2027-04-29', '02'],
  ['2027-05-06', '03'],
  ['2027-05-13', '02'],
  ['2027-05-20', '03'],
  ['2027-05-27', '02'],
  ['2027-06-03', '03'],
  ['2027-06-17', '03'],
  // Q3 2027 maturities
  ['2027-07-08', '03'],
  ['2027-07-15', '03'],
  ['2027-07-29', '03'],
  ['2027-08-12', '03'],
  ['2027-08-26', '03'],
  ['2027-09-02', '03'],
  ['2027-09-09', '03'],
  ['2027-09-23', '03'],
  // Q4 2027 maturities
  ['2027-10-07', '03'],
  ['2027-10-14', '03'],
  ['2027-10-28', '03'],
  ['2027-11-04', '03'],
  ['2027-11-11', '03'],
  ['2027-11-25', '03'],
];

export const NTB_ISIN_BY_DATE: Record<string, string> = Object.fromEntries(
  VERIFIED_NTB_ISSUES.map(([dateStr, tenorCode]) => [dateStr, buildNtbIsin(dateStr, tenorCode)])
);

/**
 * Verified Central Bank of Nigeria (CBN) OMO Bill ISINs (2026–2027 maturities),
 * cross-checked against OpenFIGI/Bloomberg and CBN auction records.
 */
export const OMO_ISIN_BY_DATE: Record<string, string> = {
  '2026-11-17': 'NGO8H1711260',
  '2026-12-01': 'NGO1H0112267',
  '2026-12-08': 'NGO7H0812269',
  '2026-12-15': 'NGO3J1512269',
  '2026-12-22': 'NGO2J2212267',
  '2026-12-29': 'NGO4J2912268',
  '2027-01-05': 'NGO5J0501276',
  '2027-01-12': 'NGO5G1201278',
  '2027-01-19': 'NGO6G1901271',
  '2027-01-26': 'NGO6J2601270',
  '2027-02-02': 'NGO7J0202277',
  '2027-02-09': 'NGO8J0902270',
  '2027-02-16': 'NGO9J1602273',
  '2027-02-23': 'NGO1K2302274',
  '2027-03-02': 'NGO6K0203275',
  '2027-03-09': 'NGO8K0903276',
  '2027-03-16': 'NGO1L1603274',
  '2027-03-23': 'NGO2K2303270',
  '2027-03-30': 'NGO3K3003273',
  '2027-04-06': 'NGO7K0604272',
  '2027-04-13': 'NGO5L1304270',
  '2027-04-20': 'NGO9K2004279',
  '2027-05-04': 'NGO2L0405273',
  '2027-06-22': 'NGO4K2206271',
  '2027-07-20': 'NGO1I2007273',
  '2027-08-03': 'NGO3L0308277',
  '2027-10-05': 'NGO6L0510271',
  '2027-11-02': 'NGO4L0211271',
};

export function getBillIsin(dateStr: string, type: 'NTB' | 'OMO'): string {
  if (type === 'NTB') {
    return NTB_ISIN_BY_DATE[dateStr] ?? '';
  }
  return OMO_ISIN_BY_DATE[dateStr] ?? '';
}
