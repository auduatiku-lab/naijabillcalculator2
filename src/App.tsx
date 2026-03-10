/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Constants & Helpers ---
const MATURITY_INVENTORY = [
  { value: "14 Oct 2025 OMO", dateStr: "2025-10-14" },
  { value: "16 Oct 2025 NTB", dateStr: "2025-10-16" },
  { value: "21 Oct 2025 OMO", dateStr: "2025-10-21" },
  { value: "23 Oct 2025 NTB", dateStr: "2025-10-23" },
  { value: "28 Oct 2025 OMO", dateStr: "2025-10-28" },
  { value: "30 Oct 2025 NTB", dateStr: "2025-10-30" },
  { value: "4 Nov 2025 OMO", dateStr: "2025-11-04" },
  { value: "6 Nov 2025 NTB", dateStr: "2025-11-06" },
  { value: "11 Nov 2025 OMO", dateStr: "2025-11-11" },
  { value: "13 Nov 2025 NTB", dateStr: "2025-11-13" },
  { value: "18 Nov 2025 OMO", dateStr: "2025-11-18" },
  { value: "20 Nov 2025 NTB", dateStr: "2025-11-20" },
  { value: "25 Nov 2025 OMO", dateStr: "2025-11-25" },
  { value: "27 Nov 2025 NTB", dateStr: "2025-11-27" },
  { value: "2 Dec 2025 OMO", dateStr: "2025-12-02" },
  { value: "4 Dec 2025 NTB", dateStr: "2025-12-04" },
  { value: "9 Dec 2025 OMO", dateStr: "2025-12-09" },
  { value: "11 Dec 2025 NTB", dateStr: "2025-12-11" },
  { value: "16 Dec 2025 OMO", dateStr: "2025-12-16" },
  { value: "18 Dec 2025 NTB", dateStr: "2025-12-18" },
  { value: "23 Dec 2025 OMO", dateStr: "2025-12-23" },
  { value: "25 Dec 2025 NTB", dateStr: "2025-12-25" },
  { value: "30 Dec 2025 OMO", dateStr: "2025-12-30" },
  { value: "1 Jan 2026 NTB", dateStr: "2026-01-01" },
  { value: "6 Jan 2026 OMO", dateStr: "2026-01-06" },
  { value: "8 Jan 2026 NTB", dateStr: "2026-01-08" },
  { value: "13 Jan 2026 OMO", dateStr: "2026-01-13" },
  { value: "15 Jan 2026 NTB", dateStr: "2026-01-15" },
  { value: "20 Jan 2026 OMO", dateStr: "2026-01-20" },
  { value: "22 Jan 2026 NTB", dateStr: "2026-01-22" },
  { value: "27 Jan 2026 OMO", dateStr: "2026-01-27" },
  { value: "29 Jan 2026 NTB", dateStr: "2026-01-29" },
  { value: "3 Feb 2026 OMO", dateStr: "2026-02-03" },
  { value: "5 Feb 2026 NTB", dateStr: "2026-02-05" },
  { value: "10 Feb 2026 OMO", dateStr: "2026-02-10" },
  { value: "12 Feb 2026 NTB", dateStr: "2026-02-12" },
  { value: "17 Feb 2026 OMO", dateStr: "2026-02-17" },
  { value: "19 Feb 2026 NTB", dateStr: "2026-02-19" },
  { value: "24 Feb 2026 OMO", dateStr: "2026-02-24" },
  { value: "26 Feb 2026 NTB", dateStr: "2026-02-26" },
  { value: "3 Mar 2026 OMO", dateStr: "2026-03-03" },
  { value: "5 Mar 2026 NTB", dateStr: "2026-03-05" },
  { value: "10 Mar 2026 OMO", dateStr: "2026-03-10" },
  { value: "12 Mar 2026 NTB", dateStr: "2026-03-12" },
  { value: "17 Mar 2026 OMO", dateStr: "2026-03-17" },
  { value: "19 Mar 2026 NTB", dateStr: "2026-03-19" },
  { value: "24 Mar 2026 OMO", dateStr: "2026-03-24" },
  { value: "26 Mar 2026 NTB", dateStr: "2026-03-26" },
  { value: "31 Mar 2026 OMO", dateStr: "2026-03-31" },
  { value: "2 Apr 2026 NTB", dateStr: "2026-04-02" },
  { value: "7 Apr 2026 OMO", dateStr: "2026-04-07" },
  { value: "9 Apr 2026 NTB", dateStr: "2026-04-09" },
  { value: "14 Apr 2026 OMO", dateStr: "2026-04-14" },
  { value: "16 Apr 2026 NTB", dateStr: "2026-04-16" },
  { value: "21 Apr 2026 OMO", dateStr: "2026-04-21" },
  { value: "23 Apr 2026 NTB", dateStr: "2026-04-23" },
  { value: "28 Apr 2026 OMO", dateStr: "2026-04-28" },
  { value: "30 Apr 2026 NTB", dateStr: "2026-04-30" },
  { value: "5 May 2026 OMO", dateStr: "2026-05-05" },
  { value: "7 May 2026 NTB", dateStr: "2026-05-07" },
  { value: "12 May 2026 OMO", dateStr: "2026-05-12" },
  { value: "14 May 2026 NTB", dateStr: "2026-05-14" },
  { value: "19 May 2026 OMO", dateStr: "2026-05-19" },
  { value: "21 May 2026 NTB", dateStr: "2026-05-21" },
  { value: "26 May 2026 OMO", dateStr: "2026-05-26" },
  { value: "28 May 2026 NTB", dateStr: "2026-05-28" },
  { value: "2 Jun 2026 OMO", dateStr: "2026-06-02" },
  { value: "4 Jun 2026 NTB", dateStr: "2026-06-04" },
  { value: "9 Jun 2026 OMO", dateStr: "2026-06-09" },
  { value: "11 Jun 2026 NTB", dateStr: "2026-06-11" },
  { value: "16 Jun 2026 OMO", dateStr: "2026-06-16" },
  { value: "18 Jun 2026 NTB", dateStr: "2026-06-18" },
  { value: "23 Jun 2026 OMO", dateStr: "2026-06-23" },
  { value: "25 Jun 2026 NTB", dateStr: "2026-06-25" },
  { value: "30 Jun 2026 OMO", dateStr: "2026-06-30" },
  { value: "2 Jul 2026 NTB", dateStr: "2026-07-02" },
  { value: "7 Jul 2026 OMO", dateStr: "2026-07-07" },
  { value: "9 Jul 2026 NTB", dateStr: "2026-07-09" },
  { value: "14 Jul 2026 OMO", dateStr: "2026-07-14" },
  { value: "16 Jul 2026 NTB", dateStr: "2026-07-16" },
  { value: "21 Jul 2026 OMO", dateStr: "2026-07-21" },
  { value: "23 Jul 2026 NTB", dateStr: "2026-07-23" },
  { value: "28 Jul 2026 OMO", dateStr: "2026-07-28" },
  { value: "30 Jul 2026 NTB", dateStr: "2026-07-30" },
  { value: "4 Aug 2026 OMO", dateStr: "2026-08-04" },
  { value: "6 Aug 2026 NTB", dateStr: "2026-08-06" },
  { value: "11 Aug 2026 OMO", dateStr: "2026-08-11" },
  { value: "13 Aug 2026 NTB", dateStr: "2026-08-13" },
  { value: "18 Aug 2026 OMO", dateStr: "2026-08-18" },
  { value: "20 Aug 2026 NTB", dateStr: "2026-08-20" },
  { value: "25 Aug 2026 OMO", dateStr: "2026-08-25" },
  { value: "27 Aug 2026 NTB", dateStr: "2026-08-27" },
  { value: "1 Sep 2026 OMO", dateStr: "2026-09-01" },
  { value: "3 Sep 2026 NTB", dateStr: "2026-09-03" },
  { value: "8 Sep 2026 OMO", dateStr: "2026-09-08" },
  { value: "10 Sep 2026 NTB", dateStr: "2026-09-10" },
  { value: "15 Sep 2026 OMO", dateStr: "2026-09-15" },
  { value: "17 Sep 2026 NTB", dateStr: "2026-09-17" },
  { value: "22 Sep 2026 OMO", dateStr: "2026-09-22" },
  { value: "24 Sep 2026 NTB", dateStr: "2026-09-24" },
  { value: "29 Sep 2026 OMO", dateStr: "2026-09-29" },
  { value: "1 Oct 2026 NTB", dateStr: "2026-10-01" },
  { value: "6 Oct 2026 OMO", dateStr: "2026-10-06" },
  { value: "8 Oct 2026 NTB", dateStr: "2026-10-08" },
  { value: "13 Oct 2026 OMO", dateStr: "2026-10-13" },
  { value: "15 Oct 2026 NTB", dateStr: "2026-10-15" },
  { value: "20 Oct 2026 OMO", dateStr: "2026-10-20" },
  { value: "22 Oct 2026 NTB", dateStr: "2026-10-22" },
  { value: "27 Oct 2026 OMO", dateStr: "2026-10-27" },
  { value: "29 Oct 2026 NTB", dateStr: "2026-10-29" },
  { value: "3 Nov 2026 OMO", dateStr: "2026-11-03" },
  { value: "5 Nov 2026 NTB", dateStr: "2026-11-05" },
  { value: "10 Nov 2026 OMO", dateStr: "2026-11-10" },
  { value: "12 Nov 2026 NTB", dateStr: "2026-11-12" },
  { value: "17 Nov 2026 OMO", dateStr: "2026-11-17" },
  { value: "19 Nov 2026 NTB", dateStr: "2026-11-19" },
  { value: "24 Nov 2026 OMO", dateStr: "2026-11-24" },
  { value: "26 Nov 2026 NTB", dateStr: "2026-11-26" },
  { value: "1 Dec 2026 OMO", dateStr: "2026-12-01" },
  { value: "3 Dec 2026 NTB", dateStr: "2026-12-03" },
  { value: "8 Dec 2026 OMO", dateStr: "2026-12-08" },
  { value: "10 Dec 2026 NTB", dateStr: "2026-12-10" },
  { value: "15 Dec 2026 OMO", dateStr: "2026-12-15" },
  { value: "17 Dec 2026 NTB", dateStr: "2026-12-17" },
  { value: "22 Dec 2026 OMO", dateStr: "2026-12-22" },
  { value: "24 Dec 2026 NTB", dateStr: "2026-12-24" },
  { value: "29 Dec 2026 OMO", dateStr: "2026-12-29" },
  { value: "31 Dec 2026 NTB", dateStr: "2026-12-31" },
];

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function parseFaceValue(value: string) {
  if (!value) return NaN;
  let cleanValue = String(value).replace(/,/g, '').trim().toLowerCase();
  let num;

  if (cleanValue.endsWith('b') || cleanValue.endsWith('bn')) {
    const numberPart = cleanValue.replace(/bn?$/, '');
    num = parseFloat(numberPart) * 1e9;
  } else if (cleanValue.endsWith('m')) {
    const numberPart = cleanValue.replace(/m$/, '');
    num = parseFloat(numberPart) * 1e6;
  } else if (cleanValue.endsWith('k')) {
    const numberPart = cleanValue.replace(/k$/, '');
    num = parseFloat(numberPart) * 1e3;
  } else {
    num = parseFloat(cleanValue);
  }
  return num;
}

export default function App() {
  // --- Refs ---
  const faceValueRef = useRef<HTMLInputElement>(null);
  const tenorInputRef = useRef<HTMLInputElement>(null);
  const discountRateRef = useRef<HTMLInputElement>(null);
  const settlementDateRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [faceValue, setFaceValue] = useState('');
  const [tenorText, setTenorText] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementDateType, setSettlementDateType] = useState<'text' | 'date'>('text');

  // Results
  const [consideration, setConsideration] = useState('');
  const [yieldVal, setYieldVal] = useState('');
  const [tenorDays, setTenorDays] = useState('');
  const [price, setPrice] = useState('');

  // --- Initialization ---
  useEffect(() => {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const formatted = localDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setSettlementDate(formatted);
  }, []);

  // --- Filtered Maturities ---
  const filteredMaturities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    const searchTokens = tenorText.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    const isSearching = searchTokens.length > 0;

    return MATURITY_INVENTORY.filter(item => {
      const [year, month, day] = item.dateStr.split('-').map(Number);
      const localMaturityDate = new Date(year, month - 1, day);

      if (localMaturityDate < today) return false;
      if (localMaturityDate > oneYearFromNow) return false;

      if (isSearching) {
        const itemWords = item.value.toLowerCase().split(/\s+/);
        return searchTokens.every(token => itemWords.some(word => word.startsWith(token)));
      }
      return true;
    });
  }, [tenorText]);

  // --- Calculation Logic ---
  useEffect(() => {
    const fvNum = parseFaceValue(faceValue);
    const drNum = parseFloat(discountRate);
    
    // Find maturity date from selected text
    const selectedItem = MATURITY_INVENTORY.find(item => item.value === tenorText);
    const maturityDateStr = selectedItem?.dateStr;

    let tenor = NaN;
    let daysInYear = 365;

    if (maturityDateStr && settlementDate) {
      // Try to parse settlement date (it might be in 'dd mmm yyyy' or 'yyyy-mm-dd' depending on state)
      const sDate = new Date(settlementDate);
      let localSettlementDate = sDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(settlementDate)) {
        const offset = sDate.getTimezoneOffset() * 60000;
        localSettlementDate = new Date(sDate.getTime() + offset);
      }

      const [mYear, mMonth, mDay] = maturityDateStr.split('-').map(Number);
      const mDate = new Date(mYear, mMonth - 1, mDay);

      const timeDiff = mDate.getTime() - localSettlementDate.getTime();
      if (timeDiff > 0) {
        tenor = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        setTenorDays(`${tenor} Days`);
        if (isLeapYear(mDate.getFullYear())) {
          daysInYear = 366;
        }
      } else {
        setTenorDays('');
      }
    } else {
      setTenorDays('');
    }

    if (isNaN(fvNum) || isNaN(drNum) || isNaN(tenor) || fvNum <= 0 || drNum < 0) {
      setConsideration('');
      setYieldVal('');
      setPrice('');
      return;
    }

    const discountAmount = (fvNum * (drNum / 100) * tenor) / daysInYear;
    const purchasePrice = fvNum - discountAmount;
    const effectiveYield = ((discountAmount / purchasePrice) * (daysInYear / tenor)) * 100;
    const pricePer100 = (1 - ((drNum / 100) * tenor) / daysInYear) * 100;

    setConsideration(`₦${purchasePrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setPrice(`₦${pricePer100.toFixed(4)}`);
    setYieldVal(`${effectiveYield.toFixed(4)}%`);
  }, [faceValue, discountRate, tenorText, settlementDate]);

  // --- Handlers ---
  const handleFaceValueInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[kmbe]/i.test(val)) {
      setFaceValue(val);
      return;
    }

    const cursorStart = e.target.selectionStart || 0;
    const originalValue = val;
    let nonCommasBeforeCursor = 0;
    for (let i = 0; i < cursorStart; i++) {
      if (originalValue[i] !== ',') nonCommasBeforeCursor++;
    }

    const rawValue = originalValue.replace(/,/g, '');
    if (!isNaN(Number(rawValue)) && rawValue !== '') {
      const parts = rawValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const formattedValue = parts.join('.');
      setFaceValue(formattedValue);

      // Restore cursor position (async to let React update DOM)
      setTimeout(() => {
        if (faceValueRef.current) {
          let newCursorPos = 0;
          let nonCommasSeen = 0;
          for (let i = 0; i < formattedValue.length; i++) {
            if (formattedValue[i] !== ',') nonCommasSeen++;
            if (nonCommasSeen >= nonCommasBeforeCursor && formattedValue[i] !== ',') {
              newCursorPos = i + 1;
              break;
            } else if (nonCommasSeen === nonCommasBeforeCursor && formattedValue[i] === ',') {
              newCursorPos = i;
            }
          }
          if (nonCommasBeforeCursor === 0) newCursorPos = 0;
          faceValueRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      setFaceValue(val);
    }
  };

  const handleFaceValueBlur = () => {
    const num = parseFaceValue(faceValue);
    if (!isNaN(num)) {
      setFaceValue(num.toLocaleString('en-US'));
    }
  };

  const handleDiscountRateBlur = () => {
    const val = parseFloat(discountRate);
    if (!isNaN(val)) {
      setDiscountRate(val.toFixed(2));
    }
  };

  const handleSettlementFocus = () => {
    if (settlementDate && settlementDateType === 'text') {
      const date = new Date(settlementDate);
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        let m = '' + (date.getMonth() + 1);
        let d = '' + date.getDate();
        if (m.length < 2) m = '0' + m;
        if (d.length < 2) d = '0' + d;
        setSettlementDate([y, m, d].join('-'));
      }
    }
    setSettlementDateType('date');
  };

  const handleSettlementBlur = () => {
    if (settlementDate) {
      const date = new Date(settlementDate);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() + offset);
      setSettlementDateType('text');
      setSettlementDate(localDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    } else {
      setSettlementDateType('text');
    }
  };

  const clearTenor = () => {
    setTenorText('');
    tenorInputRef.current?.focus();
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <header className="header-bg text-white p-2 md:p-3 shadow-md">
        <div className="container mx-auto flex items-center gap-3 md:justify-center">
          <img src="/favicon.png" alt="Logo" className="h-8 md:h-10 w-auto rounded" referrerPolicy="no-referrer" />
          <h1 className="text-lg md:text-xl font-bold">Nigerian Treasury Bill (T-Bill) Calculator</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-4 pt-2">
        <div className="grid grid-cols-1 justify-items-center">
          <div className="w-full max-w-[28rem]">
            <div className="bg-white px-4 sm:px-6 py-2.5 rounded-lg shadow-md">
              <div className="grid grid-cols-1 gap-3">
                {/* Face Value */}
                <div>
                  <label htmlFor="faceValue" className="block text-sm font-medium text-gray-700">Face Value (₦)</label>
                  <input
                    ref={faceValueRef}
                    type="text"
                    id="faceValue"
                    inputMode="numeric"
                    value={faceValue}
                    onChange={handleFaceValueInput}
                    onBlur={handleFaceValueBlur}
                    onKeyDown={(e) => e.key === 'Enter' && tenorInputRef.current?.focus()}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 1b or 1e9 or 1,000,000,000.00"
                  />
                </div>

                {/* Tenor / Maturity */}
                <div>
                  <label htmlFor="tenorInput" className="block text-sm font-medium text-gray-700">Select NTB or OMO maturity</label>
                  <div className="relative mt-1">
                    <input
                      ref={tenorInputRef}
                      type="text"
                      id="tenorInput"
                      list="maturities"
                      value={tenorText}
                      onChange={(e) => setTenorText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && discountRateRef.current?.focus()}
                      className={`block w-full pl-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                        tenorText.length > 0 ? 'pr-[140px] md:pr-[225px]' : 'pr-10'
                      }`}
                      placeholder="Type to search for a maturity..."
                    />
                    
                    {tenorText.length > 0 && (
                      <button
                        type="button"
                        onClick={clearTenor}
                        className="absolute right-[140px] md:right-[225px] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                        title="Clear selection"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <datalist id="maturities">
                    {filteredMaturities.map((item, idx) => (
                      <option key={idx} value={item.value} />
                    ))}
                  </datalist>
                </div>

                {/* Discount Rate */}
                <div>
                  <label htmlFor="discountRate" className="block text-sm font-medium text-gray-700">Discount Rate (%)</label>
                  <input
                    ref={discountRateRef}
                    type="text"
                    id="discountRate"
                    inputMode="decimal"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    onBlur={handleDiscountRateBlur}
                    onKeyDown={(e) => e.key === 'Enter' && settlementDateRef.current?.focus()}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 15.3"
                  />
                </div>

                {/* Settlement Date */}
                <div>
                  <label htmlFor="settlementDate" className="block text-sm font-medium text-gray-700">Settlement Date</label>
                  <input
                    ref={settlementDateRef}
                    type={settlementDateType}
                    id="settlementDate"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    onFocus={handleSettlementFocus}
                    onBlur={handleSettlementBlur}
                    onKeyDown={(e) => e.key === 'Enter' && settlementDateRef.current?.blur()}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="dd mmm yyyy"
                  />
                </div>

                {/* Results */}
                <div>
                  <label htmlFor="considerationCalculated" className="block text-sm font-medium text-gray-700">Consideration (₦)</label>
                  <input
                    type="text"
                    id="considerationCalculated"
                    value={consideration}
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="yieldCalculated" className="block text-sm font-medium text-gray-700">Yield (%)</label>
                  <input
                    type="text"
                    id="yieldCalculated"
                    value={yieldVal}
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="tenorCalculated" className="block text-sm font-medium text-gray-700">Tenor (days)</label>
                  <input
                    type="text"
                    id="tenorCalculated"
                    value={tenorDays}
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="priceCalculated" className="block text-sm font-medium text-gray-700">Price (per ₦100)</label>
                  <input
                    type="text"
                    id="priceCalculated"
                    value={price}
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
