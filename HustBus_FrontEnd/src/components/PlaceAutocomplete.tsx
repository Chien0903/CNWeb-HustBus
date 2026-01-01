import { useState, useEffect, useRef } from 'react';
import { searchPlaces, Place } from '../services/geocoding.ts';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.ts';

interface PlaceAutocompleteProps {
    value: any;
    onChange: (place: any) => void;
    placeholder?: string;
    id?: string;
    error?: string;
    className?: string;
}

export default function PlaceAutocomplete({
    value,
    onChange,
    placeholder,
    id,
    error,
    className
}: PlaceAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value?.label || '');
    const [suggestions, setSuggestions] = useState<Place[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
//    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value?.label) {
            setInputValue(value.label);
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSelectedIndex(-1);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!newValue.trim()) {
            setSuggestions([]);
            setIsOpen(false);
            onChange(null);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await searchPlaces(newValue);
                setSuggestions(results);
                setIsOpen(results.length > 0);
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions([]);
                setIsOpen(false);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleSelectSuggestion = (place: Place) => {
        setInputValue(place.shortName);
        setIsOpen(false);
        setSuggestions([]);
        onChange({
            label: place.shortName,
            fullName: place.name,
            coords: place.coords,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className={cn("relative", className)} ref={wrapperRef}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-navy ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:border-orange disabled:cursor-not-allowed disabled:opacity-50 pl-9 transition-all duration-200",
                        error && "border-red-500 focus-visible:ring-red-500"
                    )}
                    autoComplete="off"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto py-1">
                    {suggestions.map((place, index) => (
                        <li
                            key={place.id}
                            className={cn(
                                "px-4 py-2 cursor-pointer text-sm hover:bg-gray-100",
                                index === selectedIndex && "bg-gray-100"
                            )}
                            onClick={() => handleSelectSuggestion(place)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="font-medium text-gray-900">{place.shortName}</div>
                            <div className="text-xs text-gray-500 truncate">{place.name}</div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && !isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
                    Không tìm thấy địa điểm phù hợp
                </div>
            )}
        </div>
    );
}
