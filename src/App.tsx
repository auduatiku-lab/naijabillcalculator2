/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { getBillIsin } from './isinRegistry';

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
      const type: 'OMO' | 'NTB' = dayOfWeek === 2 ? 'OMO' : 'NTB';
      
      inventory.push({
        value: `${formattedDate} ${type}`,
        dateStr: dateStr,
        type,
        isin: getBillIsin(dateStr, type),
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return inventory;
})();

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function parseAmount(value: string) {
  if (!value) return NaN;
  const cleanValue = String(value).replace(/[₦,]/g, '').trim().toLowerCase();
  let num: number;

  if (cleanValue.endsWith('b') || cleanValue.endsWith('bn')) {
    const numberPart = cleanValue.replace(/bn?$/, '');
    num = parseFloat(numberPart) * 1e9;
  } else if (cleanValue.endsWith('m') || cleanValue.endsWith('mn')) {
    const numberPart = cleanValue.replace(/mn?$/, '');
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
  const considerationRef = useRef<HTMLInputElement>(null);
  const backspaceHoldRef = useRef<{
    faceValue: {
      activeFromEnd: boolean;
      repeatCount: number;
      sawRepeatEvent: boolean;
      mobileDeleteCount: number;
      lastDeleteTime: number;
    };
    consideration: {
      activeFromEnd: boolean;
      repeatCount: number;
      sawRepeatEvent: boolean;
      mobileDeleteCount: number;
      lastDeleteTime: number;
    };
  }>({
    faceValue: { activeFromEnd: false, repeatCount: 0, sawRepeatEvent: false, mobileDeleteCount: 0, lastDeleteTime: 0 },
    consideration: { activeFromEnd: false, repeatCount: 0, sawRepeatEvent: false, mobileDeleteCount: 0, lastDeleteTime: 0 },
  });

  // --- State ---
  const [faceValue, setFaceValue] = useState('');
  const [tenorText, setTenorText] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementDateType, setSettlementDateType] = useState<'text' | 'date'>('text');
  const [targetField, setTargetField] = useState<'faceValue' | 'discountRate' | 'consideration'>('consideration');

  // Results / Bidirectional values
  const [consideration, setConsideration] = useState('');
  const [yieldVal, setYieldVal] = useState('');
  const [, setPrice] = useState('');
  const [isinCopied, setIsinCopied] = useState(false);

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

  // --- Selected Maturity & ISIN ---
  const selectedMaturity = useMemo(
    () => MATURITY_INVENTORY.find(item => item.value === tenorText),
    [tenorText]
  );
  const selectedIsin = selectedMaturity?.isin ?? '';

  useEffect(() => {
    setIsinCopied(false);
  }, [selectedIsin]);

  // --- Tenor Calculation ---
  const tenorInfo = useMemo(() => {
    const maturityDateStr = selectedMaturity?.dateStr;

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
        if (isLeapYear(mDate.getFullYear())) {
          daysInYear = 366;
        }
      }
    }

    return { tenor, daysInYear };
  }, [selectedMaturity, settlementDate]);

  const tenorDays = !isNaN(tenorInfo.tenor) ? `${tenorInfo.tenor} Days` : '';

  // --- Solve for Consideration (from Face Value + Discount Rate) ---
  useEffect(() => {
    if (targetField !== 'consideration') return;

    const fvNum = parseAmount(faceValue);
    const drNum = parseFloat(discountRate.replace(/%/g, ''));
    const { tenor, daysInYear } = tenorInfo;

    if (isNaN(fvNum) || isNaN(drNum) || isNaN(tenor) || fvNum <= 0 || drNum < 0) {
      setConsideration('');
      setYieldVal('');
      setPrice('');
      return;
    }

    const discountAmount = (fvNum * (drNum / 100) * tenor) / daysInYear;
    const purchasePrice = fvNum - discountAmount;
    const effectiveYield = purchasePrice > 0
      ? ((discountAmount / purchasePrice) * (daysInYear / tenor)) * 100
      : NaN;
    const pricePer100 = (1 - ((drNum / 100) * tenor) / daysInYear) * 100;

    setConsideration(purchasePrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setPrice(`₦${pricePer100.toFixed(6)}`);
    setYieldVal(!isNaN(effectiveYield) ? `${effectiveYield.toFixed(6)}%` : '');
  }, [targetField, faceValue, discountRate, tenorInfo]);

  // --- Solve for Discount Rate (from Face Value + Consideration) ---
  useEffect(() => {
    if (targetField !== 'discountRate') return;

    const fvNum = parseAmount(faceValue);
    const consNum = parseAmount(consideration);
    const { tenor, daysInYear } = tenorInfo;

    if (isNaN(fvNum) || isNaN(consNum) || isNaN(tenor) || fvNum <= 0 || consNum <= 0 || consNum > fvNum) {
      setDiscountRate('');
      setYieldVal('');
      setPrice('');
      return;
    }

    const discountAmount = fvNum - consNum;
    const drNum = ((discountAmount / fvNum) * (daysInYear / tenor)) * 100;
    const effectiveYield = ((discountAmount / consNum) * (daysInYear / tenor)) * 100;
    const pricePer100 = (consNum / fvNum) * 100;

    const formattedDr = drNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
      useGrouping: false
    });

    setDiscountRate(`${formattedDr}%`);
    setPrice(`₦${pricePer100.toFixed(6)}`);
    setYieldVal(`${effectiveYield.toFixed(6)}%`);
  }, [targetField, faceValue, consideration, tenorInfo]);

  // --- Solve for Face Value (from Consideration + Discount Rate) ---
  useEffect(() => {
    if (targetField !== 'faceValue') return;

    const consNum = parseAmount(consideration);
    const drNum = parseFloat(discountRate.replace(/%/g, ''));
    const { tenor, daysInYear } = tenorInfo;
    const priceFactor = 1 - ((drNum / 100) * tenor) / daysInYear;

    if (isNaN(consNum) || isNaN(drNum) || isNaN(tenor) || consNum <= 0 || drNum < 0 || priceFactor <= 0) {
      setFaceValue('');
      setYieldVal('');
      setPrice('');
      return;
    }

    const fvNum = consNum / priceFactor;
    const discountAmount = fvNum - consNum;
    const effectiveYield = ((discountAmount / consNum) * (daysInYear / tenor)) * 100;
    const pricePer100 = priceFactor * 100;

    setFaceValue(fvNum.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setPrice(`₦${pricePer100.toFixed(6)}`);
    setYieldVal(`${effectiveYield.toFixed(6)}%`);
  }, [targetField, consideration, discountRate, tenorInfo]);

  const considerationExceedsFaceValue = useMemo(() => {
    if (targetField !== 'discountRate') return false;
    const fvNum = parseAmount(faceValue);
    const consNum = parseAmount(consideration);
    return !isNaN(fvNum) && !isNaN(consNum) && fvNum > 0 && consNum > fvNum;
  }, [targetField, faceValue, consideration]);

  // --- Target Field Resolver ---
  const resolveTargetOnEdit = (editedField: 'faceValue' | 'discountRate' | 'consideration') => {
    if (editedField !== targetField) return;

    const hasFaceValue = faceValue.trim() !== '';
    const hasDiscountRate = discountRate.replace(/%/g, '').trim() !== '';
    const hasConsideration = consideration.trim() !== '';

    if (editedField === 'consideration') {
      if (!hasFaceValue && hasDiscountRate) {
        setTargetField('faceValue');
      } else {
        setTargetField('discountRate');
      }
    } else if (editedField === 'discountRate') {
      if (!hasFaceValue && hasConsideration) {
        setTargetField('faceValue');
      } else {
        setTargetField('consideration');
      }
    } else {
      // editedField === 'faceValue'
      if (!hasDiscountRate && hasConsideration) {
        setTargetField('discountRate');
      } else {
        setTargetField('consideration');
      }
    }
  };

  // --- Handlers ---
  const resetBackspaceHold = (field: 'faceValue' | 'consideration') => {
    backspaceHoldRef.current[field] = {
      activeFromEnd: false,
      repeatCount: 0,
      sawRepeatEvent: false,
      mobileDeleteCount: 0,
      lastDeleteTime: 0,
    };
  };

  const handleAmountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'faceValue' | 'consideration',
    setter: React.Dispatch<React.SetStateAction<string>>,
    onEnter: () => void
  ) => {
    if (e.key === 'Enter') {
      resetBackspaceHold(field);
      onEnter();
      return;
    }

    const state = backspaceHoldRef.current[field];
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const isAtEnd =
        input.value.length > 0 &&
        input.selectionStart === input.value.length &&
        input.selectionEnd === input.value.length;

      if (!e.repeat) {
        state.activeFromEnd = isAtEnd;
        state.repeatCount = 0;
        state.sawRepeatEvent = false;
      } else {
        state.sawRepeatEvent = true;
        if (state.activeFromEnd && isAtEnd) {
          state.repeatCount += 1;
          // Initial press deletes 1st char, 1st repeat deletes 2nd char, 2nd repeat clears all
          if (state.repeatCount >= 2) {
            e.preventDefault();
            resolveTargetOnEdit(field);
            setter('');
            resetBackspaceHold(field);
          }
        } else {
          state.activeFromEnd = false;
          state.repeatCount = 0;
        }
      }
      return;
    }

    if (e.key !== 'Unidentified') {
      resetBackspaceHold(field);
    }
  };

  const handleAmountKeyUp = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'faceValue' | 'consideration'
  ) => {
    if (e.key === 'Backspace') {
      const state = backspaceHoldRef.current[field];
      state.activeFromEnd = false;
      state.repeatCount = 0;
    }
  };

  const handleFormattedAmountInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'faceValue' | 'consideration',
    prevValue: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const val = e.target.value;
    const state = backspaceHoldRef.current[field];
    const inputType = (e.nativeEvent as InputEvent | undefined)?.inputType;
    const isCoarsePointer =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

    if (inputType === 'deleteContentBackward' && !state.sawRepeatEvent && isCoarsePointer) {
      const prevRaw = prevValue.replace(/[₦,]/g, '');
      const newRaw = val.replace(/[₦,]/g, '');
      const cursorAtEnd =
        e.target.selectionStart === val.length && e.target.selectionEnd === val.length;
      const deletedFromEnd =
        cursorAtEnd && newRaw.length > 0 && prevRaw.length > newRaw.length && prevRaw.startsWith(newRaw);

      if (deletedFromEnd) {
        const now = Date.now();
        const elapsed = now - state.lastDeleteTime;
        if (state.mobileDeleteCount === 0) {
          state.mobileDeleteCount = 1;
          state.lastDeleteTime = now;
        } else if (state.mobileDeleteCount === 1 && elapsed <= 750) {
          state.mobileDeleteCount = 2;
          state.lastDeleteTime = now;
        } else if (state.mobileDeleteCount >= 2 && elapsed <= 180) {
          setter('');
          resetBackspaceHold(field);
          return;
        } else {
          state.mobileDeleteCount = 1;
          state.lastDeleteTime = now;
        }
      } else {
        state.mobileDeleteCount = 0;
        state.lastDeleteTime = 0;
      }
    } else if (inputType !== 'deleteContentBackward') {
      state.mobileDeleteCount = 0;
      state.lastDeleteTime = 0;
    }

    if (/[kmbne]/i.test(val)) {
      setter(val);
      return;
    }

    const cursorStart = e.target.selectionStart || 0;
    const originalValue = val;
    let nonCommasBeforeCursor = 0;
    for (let i = 0; i < cursorStart; i++) {
      if (originalValue[i] !== ',' && originalValue[i] !== '₦') nonCommasBeforeCursor++;
    }

    const rawValue = originalValue.replace(/[₦,]/g, '');
    if (!isNaN(Number(rawValue)) && rawValue !== '') {
      const parts = rawValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const formattedValue = parts.join('.');
      setter(formattedValue);

      // Restore cursor position (async to let React update DOM)
      setTimeout(() => {
        if (inputRef.current) {
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
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      setter(val);
    }
  };

  const handleFaceValueInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    resolveTargetOnEdit('faceValue');
    handleFormattedAmountInput(e, 'faceValue', faceValue, setFaceValue, faceValueRef);
  };

  const handleFaceValueBlur = () => {
    resetBackspaceHold('faceValue');
    if (targetField === 'faceValue') return;
    const num = parseAmount(faceValue);
    if (!isNaN(num)) {
      setFaceValue(num.toLocaleString('en-US'));
    }
  };

  const handleConsiderationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    resolveTargetOnEdit('consideration');
    handleFormattedAmountInput(e, 'consideration', consideration, setConsideration, considerationRef);
  };

  const handleConsiderationBlur = () => {
    resetBackspaceHold('consideration');
    if (targetField === 'consideration') return;
    const num = parseAmount(consideration);
    if (!isNaN(num)) {
      setConsideration(num.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
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

  const handleCopyIsin = async () => {
    if (!selectedIsin) return;
    try {
      await navigator.clipboard.writeText(selectedIsin);
      setIsinCopied(true);
      setTimeout(() => setIsinCopied(false), 1500);
    } catch {
      // Fallback ignored if clipboard permissions are blocked
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <main className="container mx-auto px-4 pt-1.5 pb-2">
        <div className="grid grid-cols-1 justify-items-center">
          <div className="w-full max-w-[28rem]">
            <div className="bg-white px-4 sm:px-6 py-2 rounded-lg shadow-md">
              <div className="grid grid-cols-1 gap-2">
                {/* Face Value */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="faceValue" className="block text-sm font-medium text-gray-700">Face Value (₦)</label>
                    {targetField === 'faceValue' && faceValue && (
                      <span className="text-xs text-green-700 font-medium">Calculated</span>
                    )}
                  </div>
                  <input
                    ref={faceValueRef}
                    type="text"
                    id="faceValue"
                    inputMode="text"
                    value={faceValue}
                    onChange={handleFaceValueInput}
                    onBlur={handleFaceValueBlur}
                    onKeyDown={(e) => handleAmountKeyDown(e, 'faceValue', setFaceValue, () => tenorInputRef.current?.focus())}
                    onKeyUp={(e) => handleAmountKeyUp(e, 'faceValue')}
                    className={`mt-0.5 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      targetField === 'faceValue' && faceValue ? 'bg-green-50/60' : 'bg-white'
                    }`}
                    placeholder="e.g., 1b or 1e9 or 1,000,000,000.00"
                  />
                </div>

                {/* Tenor / Maturity */}
                <div>
                  <label htmlFor="tenorInput" className="block text-sm font-medium text-gray-700">Select NTB or OMO maturity</label>
                  <div className="relative mt-0.5">
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
                      className={`block w-full pl-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
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

                {/* ISIN Number */}
                <div>
                  <label htmlFor="isinNumber" className="block text-sm font-medium text-gray-700">ISIN Number</label>
                  <div className="relative mt-0.5">
                    <input
                      type="text"
                      id="isinNumber"
                      value={selectedIsin}
                      readOnly
                      tabIndex={-1}
                      className="block w-full px-3 py-1.5 pr-10 bg-gray-100 border border-gray-300 rounded-md shadow-sm font-mono tracking-wide text-gray-800 placeholder-gray-400 focus:outline-none"
                      placeholder={
                        selectedMaturity
                          ? 'No ISIN available for this maturity'
                          : 'Auto-filled when bill is selected'
                      }
                    />
                    {selectedIsin && (
                      <button
                        type="button"
                        onClick={handleCopyIsin}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-500 hover:text-green-700 hover:bg-gray-200/70 transition-colors focus:outline-none"
                        title={isinCopied ? 'Copied' : 'Copy ISIN'}
                        aria-label={isinCopied ? 'ISIN copied' : 'Copy ISIN'}
                      >
                        {isinCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Discount Rate */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="discountRate" className="block text-sm font-medium text-gray-700">Discount Rate (%)</label>
                    {targetField === 'discountRate' && discountRate && (
                      <span className="text-xs text-green-700 font-medium">Calculated</span>
                    )}
                  </div>
                  <input
                    ref={discountRateRef}
                    type="text"
                    id="discountRate"
                    inputMode="decimal"
                    value={discountRate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/%/g, '');
                      if (!isNaN(Number(val)) || val === '' || val === '.') {
                        resolveTargetOnEdit('discountRate');
                        setDiscountRate(val);
                      }
                    }}
                    onFocus={handleDiscountRateFocus}
                    onBlur={handleDiscountRateBlur}
                    onKeyDown={(e) => e.key === 'Enter' && settlementDateRef.current?.focus()}
                    className={`mt-0.5 block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      targetField === 'discountRate' && discountRate ? 'bg-green-50/60' : 'bg-white'
                    }`}
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
                    className="mt-0.5 block w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="dd mmm yyyy"
                  />
                </div>

                {/* Consideration (Bidirectional) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="considerationCalculated" className="block text-sm font-bold text-gray-800">Consideration (₦)</label>
                    {targetField === 'consideration' && consideration && (
                      <span className="text-xs text-green-700 font-semibold">Calculated</span>
                    )}
                  </div>
                  <input
                    ref={considerationRef}
                    type="text"
                    id="considerationCalculated"
                    inputMode="text"
                    value={consideration}
                    onChange={handleConsiderationInput}
                    onBlur={handleConsiderationBlur}
                    onKeyDown={(e) => handleAmountKeyDown(e, 'consideration', setConsideration, () => considerationRef.current?.blur())}
                    onKeyUp={(e) => handleAmountKeyUp(e, 'consideration')}
                    className={`mt-0.5 block w-full px-3 py-1.5 border rounded-md shadow-sm font-bold text-gray-900 placeholder:font-normal placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      considerationExceedsFaceValue
                        ? 'bg-white border-red-400 focus:ring-red-500 focus:border-red-500'
                        : targetField === 'consideration' && consideration
                          ? 'bg-green-50/60 border-gray-300'
                          : 'bg-white border-gray-300'
                    }`}
                    placeholder="e.g., 920m or 923,709,589.04"
                  />
                  {considerationExceedsFaceValue && (
                    <p className="mt-1 text-xs text-red-600">Consideration cannot exceed Face Value.</p>
                  )}
                </div>

                {/* Results */}
                <div>
                  <label htmlFor="yieldCalculated" className="block text-sm font-medium text-gray-700">Yield (%)</label>
                  <input
                    type="text"
                    id="yieldCalculated"
                    value={yieldVal}
                    className="mt-0.5 block w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="tenorCalculated" className="block text-sm font-medium text-gray-700">Tenor (days)</label>
                  <input
                    type="text"
                    id="tenorCalculated"
                    value={tenorDays}
                    className="mt-0.5 block w-full px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                    disabled
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-center">
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
