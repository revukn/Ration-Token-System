import { useState, useEffect } from "react";
import { Input } from "./input";
import { Badge } from "./badge";

interface RationCardSearchProps {
  value: string;
  onChange: (value: string) => void;
  onValidation: (valid: boolean, message: string) => void;
  allowRegistered?: boolean;
}

export function RationCardSearch({ value, onChange, onValidation, allowRegistered = false }: RationCardSearchProps) {
  const [searchResults, setSearchResults] = useState([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await fetch(`/api/ration-cards/search?query=${query}`);
      const results = await response.json();
      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const validateCard = async (cardNumber: string) => {
    if (cardNumber.length < 10) return;
    
    setIsValidating(true);
    try {
      const response = await fetch(
        `/api/ration-cards/validate/${cardNumber}${allowRegistered ? "?allowRegistered=true" : ""}`
      );
      const result = await response.json();
      
      setIsValid(result.valid);
      setValidationMessage(result.message);
      onValidation(result.valid, result.message);
    } catch (error) {
      setIsValid(false);
      setValidationMessage('Validation failed');
      onValidation(false, 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (value.length >= 3) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [value]);

  useEffect(() => {
    if (value.length >= 10) {
      const timeoutId = setTimeout(() => {
        validateCard(value);
      }, 500); // Debounce validation
      return () => clearTimeout(timeoutId);
    } else {
      setIsValid(null);
      setValidationMessage('');
      onValidation(false, '');
    }
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="Enter ration card number (e.g., KA-BNG-2024-001)"
        className="uppercase"
      />
      
      {isValidating && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((card: any) => (
            <div
              key={card.rationCardNumber}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                onChange(card.rationCardNumber);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-sm">{card.rationCardNumber}</div>
              <div className="text-xs text-gray-600">
                {card.holderName} - {card.cardType}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {validationMessage && (
        <div className={`mt-2 text-sm flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {isValid ? (
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          ) : (
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          )}
          <span>{validationMessage}</span>
        </div>
      )}
    </div>
  );
}
