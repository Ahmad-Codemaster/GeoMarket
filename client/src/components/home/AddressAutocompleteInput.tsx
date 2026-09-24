import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, AlertCircle } from 'lucide-react';
import { useForwardGeocode } from '../../hooks/useAddresses';
import type { GeocodingResultDto } from '@geomarket/shared';

export type ActiveLocationSource =
  | 'saved_address'
  | 'gps'
  | 'map'
  | 'geocoded'
  | 'demo'
  | 'default';

export interface ActiveLocation {
  latitude: number;
  longitude: number;
  label: string;
  addressLine?: string;
  city?: string;
  source: ActiveLocationSource;
}

interface AddressAutocompleteInputProps {
  currentAddressLabel?: string;
  onSelectLocation: (location: ActiveLocation) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocompleteInput({
  currentAddressLabel,
  onSelectLocation,
  placeholder = 'Enter delivery street, neighborhood, or area...',
  className = '',
}: AddressAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(currentAddressLabel || '');
  const [suggestions, setSuggestions] = useState<GeocodingResultDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const forwardGeocodeMutation = useForwardGeocode();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize input value if external address label changes and user isn't actively searching
  useEffect(() => {
    if (currentAddressLabel && !isOpen) {
      setInputValue(currentAddressLabel);
    }
  }, [currentAddressLabel, isOpen]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setValidationError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await forwardGeocodeMutation.mutateAsync({
          query: val.trim(),
          limit: 5,
        });
        if (res?.locations && res.locations.length > 0) {
          setSuggestions(res.locations);
          setIsOpen(true);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(true);
        }
      } catch {
        setSuggestions([]);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item: GeocodingResultDto) => {
    const label = item.addressLine
      ? `${item.addressLine}${item.city ? `, ${item.city}` : ''}`
      : item.formattedAddress;

    setInputValue(label);
    setIsOpen(false);
    setSuggestions([]);
    setValidationError(null);

    onSelectLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      label,
      addressLine: item.addressLine,
      city: item.city,
      source: 'geocoded',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setValidationError('Please select a verified location from the suggestions or use the map.');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setValidationError(null);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm bg-background/90 rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
        <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-label="Delivery address search"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />

        {forwardGeocodeMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}

        {inputValue && !forwardGeocodeMutation.isPending && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            aria-label="Clear address input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Validation Warning */}
      {validationError && (
        <div className="absolute left-0 right-0 -bottom-6 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium px-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 p-1 bg-popover/95 backdrop-blur-md text-popover-foreground rounded-xl border shadow-xl max-h-64 overflow-y-auto divide-y divide-border/50 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <li
                key={`${item.latitude}-${item.longitude}-${idx}`}
                role="option"
                aria-selected={idx === selectedIndex}
                onClick={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  idx === selectedIndex
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted/70'
                }`}
              >
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.addressLine || item.formattedAddress}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.city} {item.stateProvince ? `• ${item.stateProvince}` : ''} {item.country ? `• ${item.country}` : ''}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="p-3 text-center text-xs text-muted-foreground">
              No matching verified locations found. Try searching a major street, area, or city.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
