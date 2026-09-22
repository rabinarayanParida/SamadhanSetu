import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';

/**
 * LocationPicker Component
 * Captures GPS location, displays interactive Google Map,
 * and provides database-backed cascading administrative location selection:
 * State → District → Block/Subdivision → Village/City/Locality → Pincode
 *
 * Props:
 * - location: { latitude, longitude, address, state, district, block, village_city, pincode }
 * - onChange: (locationData) => void
 */
export default function LocationPicker({ location = {}, onChange }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Cascading administrative data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [localities, setLocalities] = useState([]);

  // Loading states
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  // Mode for entering custom/unlisted village
  const [customVillageMode, setCustomVillageMode] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasApiKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  // 1. Fetch States on mount
  useEffect(() => {
    let mounted = true;
    setLoadingStates(true);
    API.get('/locations/states')
      .then((res) => {
        if (!mounted) return;
        const list = res.data.data || [];
        setStates(list);
        // Default to Jharkhand if state is not yet set
        if (!location.state && list.length > 0) {
          const jh = list.find((s) => s.name.toLowerCase() === 'jharkhand') || list[0];
          onChange({ ...location, state: jh.name });
        }
      })
      .catch((err) => {
        console.error('Failed to load states:', err);
      })
      .finally(() => {
        if (mounted) setLoadingStates(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (!location.state) {
      setDistricts([]);
      setBlocks([]);
      setLocalities([]);
      return;
    }
    let mounted = true;
    setLoadingDistricts(true);
    API.get(`/locations/districts?state=${encodeURIComponent(location.state)}`)
      .then((res) => {
        if (!mounted) return;
        setDistricts(res.data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load districts:', err);
        if (mounted) setDistricts([]);
      })
      .finally(() => {
        if (mounted) setLoadingDistricts(false);
      });
    return () => {
      mounted = false;
    };
  }, [location.state]);

  // 3. Fetch Blocks when District changes
  useEffect(() => {
    if (!location.district) {
      setBlocks([]);
      setLocalities([]);
      return;
    }
    let mounted = true;
    setLoadingBlocks(true);
    API.get(`/locations/blocks?district=${encodeURIComponent(location.district)}`)
      .then((res) => {
        if (!mounted) return;
        setBlocks(res.data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load blocks:', err);
        if (mounted) setBlocks([]);
      })
      .finally(() => {
        if (mounted) setLoadingBlocks(false);
      });
    return () => {
      mounted = false;
    };
  }, [location.district]);

  // 4. Fetch Localities when Block changes
  useEffect(() => {
    if (!location.block) {
      setLocalities([]);
      return;
    }
    let mounted = true;
    setLoadingLocalities(true);
    API.get(`/locations/localities?block=${encodeURIComponent(location.block)}`)
      .then((res) => {
        if (!mounted) return;
        const list = res.data.data || [];
        setLocalities(list);
        // If current village_city is not in the list and is not empty, switch to custom mode
        if (location.village_city && list.length > 0 && !list.some((l) => l.name === location.village_city)) {
          setCustomVillageMode(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load localities:', err);
        if (mounted) setLocalities([]);
      })
      .finally(() => {
        if (mounted) setLoadingLocalities(false);
      });
    return () => {
      mounted = false;
    };
  }, [location.block]);

  // Initialize Google Map
  useEffect(() => {
    if (!hasApiKey || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const loadMap = () => {
      if (!window.google?.maps) return;

      const lat = location.latitude || 23.3441;
      const lng = location.longitude || 85.3096;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        zoom: location.latitude ? 14 : 8,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
        ],
      });

      mapInstanceRef.current = map;

      if (location.latitude && location.longitude) {
        placeMarker(map, { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) });
      }

      map.addListener('click', (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        placeMarker(map, pos);
        reverseGeocode(pos.lat, pos.lng);
      });
    };

    if (window.google?.maps) {
      loadMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = loadMap;
      document.head.appendChild(script);
    }
  }, [hasApiKey]);

  // Pan map when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && location.latitude && location.longitude) {
      const pos = { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) };
      mapInstanceRef.current.panTo(pos);
      mapInstanceRef.current.setZoom(14);
      placeMarker(mapInstanceRef.current, pos);
    }
  }, [location.latitude, location.longitude]);

  function placeMarker(map, pos) {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    markerRef.current = new window.google.maps.Marker({
      position: pos,
      map,
      animation: window.google.maps.Animation.DROP,
    });
  }

  // Reverse Geocoding with Google Maps
  async function reverseGeocode(lat, lng) {
    if (!hasApiKey) {
      onChange({ ...location, latitude: lat, longitude: lng });
      return;
    }
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      if (result.results?.[0]) {
        const components = result.results[0].address_components;
        const parsed = parseAddressComponents(components);
        onChange({
          ...location,
          latitude: lat,
          longitude: lng,
          address: result.results[0].formatted_address,
          // Assist fields if currently empty
          state: location.state || parsed.state || 'Jharkhand',
          district: location.district || parsed.district || '',
          pincode: location.pincode || parsed.pincode || '',
        });
        return;
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
    onChange({ ...location, latitude: lat, longitude: lng });
  }

  function parseAddressComponents(components) {
    const data = {};
    for (const c of components) {
      if (c.types.includes('administrative_area_level_1')) {
        data.state = c.long_name;
      }
      if (c.types.includes('administrative_area_level_2')) {
        data.district = c.long_name;
      }
      if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) {
        data.block = c.long_name;
      }
      if (c.types.includes('administrative_area_level_3') || c.types.includes('locality')) {
        data.village_city = c.long_name;
      }
      if (c.types.includes('postal_code')) {
        data.pincode = c.long_name;
      }
    }
    return data;
  }

  // GPS Capture
  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (hasApiKey) {
          reverseGeocode(lat, lng);
        } else {
          onChange({ ...location, latitude: lat, longitude: lng });
        }
        setGpsLoading(false);
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Please allow location access or select from the administrative hierarchy below.',
          2: 'Location unavailable. Please select from the administrative hierarchy below.',
          3: 'Location request timed out. Please try again.',
        };
        setGpsError(messages[error.code] || 'Failed to capture GPS location.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [location, hasApiKey]);

  // Search location
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim() || !hasApiKey) return;
    setSearching(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const stateSuffix = location.state ? `, ${location.state}, India` : ', Jharkhand, India';
      const result = await geocoder.geocode({ address: searchQuery + stateSuffix });
      if (result.results?.[0]) {
        const loc = result.results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        const parsed = parseAddressComponents(result.results[0].address_components);
        onChange({
          ...location,
          latitude: lat,
          longitude: lng,
          address: result.results[0].formatted_address,
          pincode: location.pincode || parsed.pincode || '',
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(14);
          placeMarker(mapInstanceRef.current, { lat, lng });
        }
      }
    } catch {}
    setSearching(false);
  }, [searchQuery, hasApiKey, location]);

  // --- CASCADING CHANGE HANDLERS (with dependent child clearing) ---

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setCustomVillageMode(false);
    // Clear dependent children: district, block, village_city
    onChange({
      ...location,
      state: newState,
      district: '',
      block: '',
      village_city: '',
    });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setCustomVillageMode(false);
    // Clear dependent children: block, village_city
    onChange({
      ...location,
      district: newDistrict,
      block: '',
      village_city: '',
    });
  };

  const handleBlockChange = (e) => {
    const newBlock = e.target.value;
    setCustomVillageMode(false);
    // Clear dependent child: village_city
    onChange({
      ...location,
      block: newBlock,
      village_city: '',
    });
  };

  const handleLocalitySelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setCustomVillageMode(true);
      onChange({ ...location, village_city: '' });
      return;
    }

    const locObj = localities.find((l) => l.name === val);
    const updated = {
      ...location,
      village_city: val,
    };

    if (locObj?.pincode) {
      updated.pincode = locObj.pincode;
    }
    if (locObj?.latitude && locObj?.longitude && !location.latitude) {
      updated.latitude = locObj.latitude;
      updated.longitude = locObj.longitude;
    }

    onChange(updated);
  };

  return (
    <div className="location-picker">
      {/* 1. HIERARCHICAL ADMINISTRATIVE DROPDOWNS */}
      <div className="location-manual" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            🏛️ Administrative Location Hierarchy
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required for institutional routing</span>
        </div>

        {/* State and District Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="loc-state">
              State * {loadingStates && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Loading...)</span>}
            </label>
            <select
              id="loc-state"
              value={location.state || ''}
              onChange={handleStateChange}
              disabled={loadingStates}
            >
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loc-district">
              District * {loadingDistricts && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Loading...)</span>}
            </label>
            <select
              id="loc-district"
              value={location.district || ''}
              onChange={handleDistrictChange}
              disabled={!location.state || loadingDistricts}
            >
              <option value="">
                {!location.state ? 'Select state first' : 'Select District'}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Block and Village/City/Locality Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="loc-block">
              Block / Subdivision * {loadingBlocks && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Loading...)</span>}
            </label>
            <select
              id="loc-block"
              value={location.block || ''}
              onChange={handleBlockChange}
              disabled={!location.district || loadingBlocks}
            >
              <option value="">
                {!location.district ? 'Select district first' : 'Select Block / Subdivision'}
              </option>
              {blocks.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loc-village">
              Village / City / Locality * {loadingLocalities && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Loading...)</span>}
            </label>

            {!customVillageMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <select
                  id="loc-village"
                  value={location.village_city || ''}
                  onChange={handleLocalitySelect}
                  disabled={!location.block || loadingLocalities}
                >
                  <option value="">
                    {!location.block ? 'Select block first' : 'Select Village / City / Locality'}
                  </option>
                  {localities.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name} {l.pincode ? `(${l.pincode})` : ''}
                    </option>
                  ))}
                  {location.block && (
                    <option value="__custom__">✍️ Other / Enter village manually...</option>
                  )}
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="loc-village-custom"
                  type="text"
                  value={location.village_city || ''}
                  onChange={(e) => onChange({ ...location, village_city: e.target.value })}
                  placeholder="Enter specific village or locality"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setCustomVillageMode(false)}
                  title="Switch back to standard locality list"
                >
                  List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pincode & Street Address */}
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: '180px' }}>
            <label htmlFor="loc-pincode">Pincode</label>
            <input
              id="loc-pincode"
              type="text"
              value={location.pincode || ''}
              onChange={(e) => onChange({ ...location, pincode: e.target.value.replace(/[^\d]/g, '') })}
              placeholder="e.g. 834009"
              maxLength={6}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="loc-address">Full Address / Specific Landmark</label>
            <input
              id="loc-address"
              type="text"
              value={location.address || ''}
              onChange={(e) => onChange({ ...location, address: e.target.value })}
              placeholder="Nearby landmark, road, ward, or Panchayat details..."
            />
          </div>
        </div>
      </div>

      {/* 2. GPS & GOOGLE MAPS SECTION */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            📍 Precise GPS & Map Coordinates
          </h4>
          <button
            type="button"
            className="btn btn-gps btn-sm"
            onClick={captureGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <span className="btn-loading"><span className="spinner" /> Detecting GPS...</span>
            ) : (
              <>📍 Use Current GPS</>
            )}
          </button>
        </div>

        {gpsError && <p className="field-error" style={{ marginBottom: '10px' }}>{gpsError}</p>}

        {location.latitude ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>📌 Confirmed Coordinates:</span>
            <code>{parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}</code>
            <button
              type="button"
              onClick={() => onChange({ ...location, latitude: null, longitude: null })}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
            >
              Clear GPS
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Click &quot;Use Current GPS&quot; or pin directly on the map to pinpoint the exact site.
          </p>
        )}

        {/* Search location */}
        {hasApiKey && (
          <div className="location-search" style={{ marginBottom: '12px' }}>
            <div className="search-bar">
              <input
                type="text"
                placeholder={`Search site in ${location.district || location.state || 'Jharkhand'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
              />
              <button type="button" onClick={searchLocation} disabled={searching} className="btn btn-search">
                {searching ? '...' : '🔍'}
              </button>
            </div>
          </div>
        )}

        {/* Map Container */}
        {hasApiKey && (
          <div className="location-map-container">
            <div ref={mapRef} className="location-map" />
            <p className="map-hint">Click anywhere on the map to pin the precise location</p>
          </div>
        )}

        {!hasApiKey && (
          <div className="location-static-map" style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              🗺️ Map display active: {location.latitude ? `${parseFloat(location.latitude).toFixed(4)}, ${parseFloat(location.longitude).toFixed(4)}` : 'Coordinates set automatically via selection'}
            </p>
            <p className="map-hint" style={{ marginTop: '4px', margin: 0 }}>
              Google Maps API integration coordinates with selected administrative boundaries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
