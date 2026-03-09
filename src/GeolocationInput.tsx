import { useCallback, useEffect, useRef, useState } from 'react';
import { useInput, useTranslate, type InputProps } from 'react-admin';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Box, TextField, Typography, Stack } from '@mui/material';

interface GeolocationValue {
  address?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  zipCode?: string;
  city?: string;
  country?: string;
}

interface GeolocationInputProps extends Omit<InputProps, 'source'> {
  source: string;
  provider?: string;
  defaultZoom?: number;
  defaultLat?: number;
  defaultLng?: number;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

function PlaceAutocomplete({
  onPlaceSelect,
  searchLabel,
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  searchLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;
  const placesLib = useMapsLibrary('places');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'address_components'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelectRef.current(place);
    });

    autocompleteRef.current = autocomplete;
  }, [placesLib]);

  return (
    <TextField
      inputRef={inputRef}
      label={searchLabel}
      variant="outlined"
      size="small"
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  );
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: google.maps.LatLngLiteral;
  onDragEnd: (position: google.maps.LatLngLiteral) => void;
}) {
  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onDragEnd({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [onDragEnd],
  );

  return (
    <AdvancedMarker
      position={position}
      draggable
      onDragEnd={handleDragEnd}
    />
  );
}

function MapContent({
  value,
  defaultZoom,
  defaultLat,
  defaultLng,
  onChange,
  searchLabel,
}: {
  value: GeolocationValue;
  defaultZoom: number;
  defaultLat: number;
  defaultLng: number;
  onChange: (value: GeolocationValue) => void;
  searchLabel: string;
}) {
  const map = useMap();
  const lat = value.lat ?? defaultLat;
  const lng = value.lng ?? defaultLng;
  const zoom = value.zoom ?? defaultZoom;
  const hasPosition = value.lat != null && value.lng != null;

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult | null) => {
      if (!place?.geometry?.location) return;

      const newValue: GeolocationValue = {
        ...value,
        address: place.formatted_address ?? '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        zipCode: undefined,
        city: undefined,
        country: undefined,
      };

      if (place.address_components) {
        for (const component of place.address_components) {
          if (component.types.includes('postal_code')) {
            newValue.zipCode = component.long_name;
          }
          if (component.types.includes('locality')) {
            newValue.city = component.long_name;
          }
          if (component.types.includes('country')) {
            newValue.country = component.long_name;
          }
        }
      }

      onChange(newValue);

      if (map) {
        map.panTo({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
        map.setZoom(defaultZoom);
      }
    },
    [value, onChange, map, defaultZoom],
  );

  const handleMarkerDrag = useCallback(
    (position: google.maps.LatLngLiteral) => {
      onChange({
        ...value,
        lat: position.lat,
        lng: position.lng,
      });
    },
    [value, onChange],
  );

  return (
    <Stack spacing={1.5}>
      <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} searchLabel={searchLabel} />

      <Box sx={{ height: 300, width: '100%' }}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={zoom}
          mapId="GEOLOCATION_MAP"
          gestureHandling="cooperative"
        >
          {hasPosition && (
            <DraggableMarker
              position={{ lat, lng }}
              onDragEnd={handleMarkerDrag}
            />
          )}
        </Map>
      </Box>

      {hasPosition && (
        <Stack spacing={0.5}>
          {value.address && (
            <Typography variant="body2" color="text.secondary">
              {value.address}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {lat.toFixed(6)}, {lng.toFixed(6)}
            {value.city && ` — ${value.city}`}
            {value.country && `, ${value.country}`}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

export function GeolocationInput({
  source,
  defaultZoom = 13,
  defaultLat = 48.85,
  defaultLng = 2.35,
  label,
  helperText,
  isRequired,
  ...props
}: GeolocationInputProps) {
  const translate = useTranslate();
  const searchTranslationKey = 'psyched.fields.search_address';
  const searchTranslated = translate(searchTranslationKey);
  const searchLabel = searchTranslated !== searchTranslationKey ? searchTranslated : 'Search address';

  const {
    field,
    fieldState: { error },
  } = useInput({ source, ...props });

  const [value, setValue] = useState<GeolocationValue>(() => {
    if (field.value && typeof field.value === 'object') {
      return field.value as GeolocationValue;
    }
    return {};
  });

  useEffect(() => {
    if (field.value && typeof field.value === 'object') {
      setValue(field.value as GeolocationValue);
    }
  }, [field.value]);

  const handleChange = useCallback(
    (newValue: GeolocationValue) => {
      setValue(newValue);
      field.onChange(newValue);
    },
    [field],
  );

  if (!API_KEY) {
    return (
      <Box sx={{ p: 2, border: '1px dashed', borderColor: 'warning.main', borderRadius: 1 }}>
        <Typography color="warning.main" variant="body2">
          Geolocation field requires VITE_GOOGLE_MAPS_API_KEY environment variable.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
          {isRequired && ' *'}
        </Typography>
      )}
      <APIProvider apiKey={API_KEY} libraries={['places']}>
        <MapContent
          value={value}
          defaultZoom={defaultZoom}
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          onChange={handleChange}
          searchLabel={searchLabel}
        />
      </APIProvider>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {error.message}
        </Typography>
      )}
    </Box>
  );
}
