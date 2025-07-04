"use client"
import { useEffect, useRef, useState } from 'react';
import { Input } from '@nextui-org/react';
import { MapPinIcon } from 'lucide-react';

interface GoogleAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  onAutocompleteActive?: (active: boolean) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleAutocomplete({
  value,
  onChange,
  placeholder = "Digite o endereço...",
  className = "",
  label = "Endereço",
  onAutocompleteActive
}: GoogleAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteSuggestion = useRef<any>(null);
  const placesService = useRef<any>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  // Sincroniza valor externo com o interno
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Carrega Google Maps Places API
  useEffect(() => {
    function safeInit() {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        window.google.maps.places.AutocompleteService
      ) {
        try {
          autocompleteSuggestion.current = new window.google.maps.places.AutocompleteService();
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
          setIsGoogleReady(true);
        } catch (error) {
          console.error('Erro ao inicializar Google Maps Places:', error);
        }
      }
    }

    // Tentar inicializar imediatamente
    safeInit();
    
    // Se não funcionar, tentar a cada 100ms por até 10 segundos
    const interval = setInterval(safeInit, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.warn('Google Maps Places não foi carregado após 10 segundos');
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Busca sugestões de endereço
  useEffect(() => {
    if (!isGoogleReady || !inputValue || inputValue.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (autocompleteSuggestion.current && typeof autocompleteSuggestion.current.getPlacePredictions === 'function') {
      autocompleteSuggestion.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: 'br' },
        },
        (predictions: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      );
    }
  }, [inputValue, isGoogleReady]);

  // Selecionar sugestão
  const handleSelect = (suggestion: any) => {
    setShowDropdown(false);
    setInputValue(suggestion.description);

    if (placesService.current && placesService.current.getDetails) {
      // Sempre use o PlacesService
      placesService.current.getDetails(
        { placeId: suggestion.place_id, fields: ['formatted_address', 'geometry'] },
        (place: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const address = place.formatted_address;
            const coordinates = place.geometry && place.geometry.location
              ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
              : undefined;
            onChange(address, coordinates);
          } else {
            onChange(suggestion.description, undefined);
          }
        }
      );
    } else {
      onChange(suggestion.description, undefined);
    }
  };

  useEffect(() => {
    if (typeof onAutocompleteActive === 'function') {
      onAutocompleteActive(showDropdown);
    }
  }, [showDropdown, onAutocompleteActive]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        startContent={<MapPinIcon size={16} />}
        className="input-theme"
        autoComplete="off"
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 8,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {suggestions.map(suggestion => (
            <li
              key={suggestion.place_id}
              style={{ padding: 12, cursor: 'pointer', color: '#222' }}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 