/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- Constants & Helpers ---
const MATURITY_INVENTORY = (() => {
  const inventory = [];
  const start = new Date(2025, 0, 1); // Start from Jan 2025
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2); // Generate up to 2 years from now
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // OMO maturities are typically on Tuesdays (2)
    // NTB maturities are typically on Thursdays (4)
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      const formattedDate = `${current.getDate()} ${months[current.getMonth()]} ${current.getFullYear()}`;
      const type = dayOfWeek === 2 ? 'OMO' : 'NTB';
      
      inventory.push({
        value: `${formattedDate} ${type}`,
        dateStr: dateStr
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return inventory;
})();

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
    
    // Maximum 366 days from today as requested
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 366);

    const searchTokens = tenorText.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    const isSearching = searchTokens.length > 0;

    return MATURITY_INVENTORY.filter(item => {
      const [year, month, day] = item.dateStr.split('-').map(Number);
      const localMaturityDate = new Date(year, month - 1, day);

      if (localMaturityDate < today) return false;
      if (localMaturityDate > maxDate) return false;

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

    setConsideration(purchasePrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setPrice(`₦${pricePer100.toFixed(6)}`);
    setYieldVal(`${effectiveYield.toFixed(6)}%`);
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
    const cleanVal = discountRate.replace('%', '');
    const val = parseFloat(cleanVal);
    if (!isNaN(val)) {
      // Format to at least 2 decimal places, up to 6
      const formatted = val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
        useGrouping: false
      });
      setDiscountRate(formatted + '%');
    }
  };

  const handleDiscountRateFocus = () => {
    setDiscountRate(discountRate.replace('%', ''));
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
      <main className="container mx-auto px-4 pb-4 pt-4">
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
                    inputMode="text"
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (filteredMaturities.length === 1) {
                            setTenorText(filteredMaturities[0].value);
                          }
                          discountRateRef.current?.focus();
                        }
                      }}
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/%/g, '');
                      if (!isNaN(Number(val)) || val === '' || val === '.') {
                        setDiscountRate(val);
                      }
                    }}
                    onFocus={handleDiscountRateFocus}
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
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                  © 2025 All rights reserved. Vega Securities Limited
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
