import { useState, useEffect } from 'react';

// Centralized logic to calculate profile progress
export function calculateProgress(data: any): number {
  if (!data) return 0;
  
  // Define the core fields that constitute a "Complete Profile"
  const requiredFields = [
    data.aadhaar,        // Profile
    data.mobile,         // Profile
    data.bankName,       // Bank
    data.accountNo,      // Bank
    data.ifsc,           // Bank
    data.district,       // Land
    data.taluka,         // Land
    data.surveyNo,       // Land
    data.landArea        // Land
  ];

  // Count fields that are not null, undefined, or empty strings
  const filledFields = requiredFields.filter(field => 
    field !== undefined && field !== null && field.toString().trim() !== ''
  ).length;

  return Math.round((filledFields / requiredFields.length) * 100);
}

// Custom hook for auto-saving form data to localStorage
export function usePersistedForm<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse form data", e);
      }
    }
  }, [key]);

  // Save to localStorage and dispatch event on change
  const setPersistedData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const nextVal = value instanceof Function ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(nextVal));
      
      // Broadcast event so the Progress Bar updates instantly
      window.dispatchEvent(new Event('formProgressUpdate'));
      
      return nextVal;
    });
  };

  return [data, setPersistedData] as const;
}
