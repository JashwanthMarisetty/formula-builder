import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

// Global flag to prevent multiple script loading
let isGoogleMapsScriptLoaded = false;
let googleMapsLoadPromise = null;

const GoogleMap = ({
  onLocationSelect,
  initialLocation = { lat: 13.368309, lng: 78.571367 }, // Default to San Francisco
  zoom = 10,
  height = "400px",
  showUseMyLocationButton = true,
  showCoordinates = true,
  isInteractive = true,
  markers = [], // Array of markers for analytics view
  enableClustering = false,
  className = "",
  heatmapPoints = null,
}) => {
  function roundTo3(n) {
    return Number(n.toFixed(3));
  }

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [userLocation, setUserLocation] = useState(null);

  // Keep latest callback without retriggering effects
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Load API and initialize map ONCE
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Return existing promise if script is already loading
      if (googleMapsLoadPromise) {
        return googleMapsLoadPromise;
      }

      googleMapsLoadPromise = new Promise((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          isGoogleMapsScriptLoaded = true;
          resolve(window.google.maps);
          return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          // Wait for existing script to load
          existingScript.addEventListener("load", () => {
            if (window.google && window.google.maps) {
              isGoogleMapsScriptLoaded = true;
              resolve(window.google.maps);
            } else {
              reject(new Error("Google Maps API failed to initialize"));
            }
          });
          existingScript.addEventListener("error", () => {
            reject(new Error("Failed to load Google Maps API"));
          });
          return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
          reject(
            new Error(
              "Google Maps API key not configured. Please check your .env file."
            )
          );
          return;
        }

        // Add callback function to global scope
        const callbackName = "initGoogleMaps" + Date.now();
        window[callbackName] = () => {
          isGoogleMapsScriptLoaded = true;
          resolve(window.google.maps);
          delete window[callbackName];
        };

        // Create script element
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,visualization&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
          delete window[callbackName];
          reject(
            new Error(
              "Failed to load Google Maps API. Please check your API key and billing settings."
            )
          );
        };

        document.head.appendChild(script);
      });

      return googleMapsLoadPromise;
    };

    const initMap = async () => {
      try {
        const googleMaps = await loadGoogleMapsAPI();

        if (!mapRef.current) return;

        const map = new googleMaps.Map(mapRef.current, {
          center: initialLocation,
          zoom: zoom,
          disableDefaultUI: !isInteractive,
          clickableIcons: isInteractive,
          gestureHandling: isInteractive ? "auto" : "none",
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;

        if (isInteractive) {
          // Add click listener for location selection
          map.addListener("click", (event) => {
            const location = {
lat: roundTo3(event.latLng.lat()),
              lng: roundTo3(event.latLng.lng()),
            };
            setSelectedLocation(location);
            updateMarker(location);
            onLocationSelectRef.current &&
              onLocationSelectRef.current(location);
          });

          // Add initial marker
          updateMarker(initialLocation || selectedLocation);
        }

        // Add markers for analytics view (only when provided)
        if (markers && markers.length > 0) {
          markers.forEach((markerData, index) => {
            const marker = new googleMaps.Marker({
              position: { lat: markerData.lat, lng: markerData.lng },
              map: map,
              title: markerData.title || `Location ${index + 1}`,
            });

            if (markerData.infoWindow) {
              const infoWindow = new googleMaps.InfoWindow({
                content: markerData.infoWindow,
              });

              marker.addListener("click", () => {
                infoWindow.open(map, marker);
              });
            }
          });

          if (markers.length > 1) {
            const bounds = new googleMaps.LatLngBounds();
            markers.forEach((marker) =>
              bounds.extend({ lat: marker.lat, lng: marker.lng })
            );
            map.fitBounds(bounds);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        if (err.message?.includes("API key")) {
          setError(
            "Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file."
          );
        } else {
          setError(
            "Failed to load Google Maps. Please check your API key and internet connection."
          );
        }
        setIsLoading(false);
      }
    };

    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only recenter/update marker when coords actually change
  useEffect(() => {
    if (!initialLocation || !mapInstanceRef.current) return;
    if (
      typeof initialLocation.lat === "number" &&
      typeof initialLocation.lng === "number"
    ) {
      setSelectedLocation(initialLocation);
      updateMarker(initialLocation);
    }
  }, [initialLocation?.lat, initialLocation?.lng]);

  // Heatmap support - update when points change
  const heatmapRef = useRef(null);
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (
      !heatmapPoints ||
      !Array.isArray(heatmapPoints) ||
      heatmapPoints.length === 0
    ) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      return;
    }
    if (
      !(window.google && window.google.maps && window.google.maps.visualization)
    )
      return;
    const data = heatmapPoints.map(
      (p) => new window.google.maps.LatLng(p.lat, p.lng)
    );
    if (!heatmapRef.current) {
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data,
      });
      heatmapRef.current.setMap(mapInstanceRef.current);
    } else {
      heatmapRef.current.setData(data);
    }
  }, [heatmapPoints]);

  const updateMarker = (location) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: "Selected Location",
      animation: google.maps.Animation.DROP,
    });

    // Center map on new location
    mapInstanceRef.current.setCenter(location);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
lat: roundTo3(position.coords.latitude),
          lng: roundTo3(position.coords.longitude),
        };
        setSelectedLocation(location);
        setUserLocation(location);
        updateMarker(location);
        onLocationSelectRef.current && onLocationSelectRef.current(location);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting user location:", error);
        alert(
          "Unable to get your location. Please select manually on the map."
        );
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  if (error) {
    return (
      <div
        className={`border-2 border-dashed border-red-300 rounded-lg p-6 text-center bg-red-50 ${className}`}
      >
        <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
        <div className="text-red-600 text-xs space-y-1">
          <p>Common solutions:</p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
            <li>Check if your Google Maps API key is valid</li>
            <li>Enable billing in Google Cloud Console</li>
            <li>Enable Maps JavaScript API and Geocoding API</li>
            <li>Add localhost to allowed domains in API restrictions</li>
            <li>Verify VITE_GOOGLE_MAPS_API_KEY in .env file</li>
          </ul>
          <p className="mt-2 text-gray-500">
            Current API key:{" "}
            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
              ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 8) + "..."
              : "Not configured"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 overflow-hidden"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Use My Location Button */}
      {showUseMyLocationButton && isInteractive && !isLoading && (
        <button
          onClick={useMyLocation}
          className="absolute top-2 right-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          title="Use my current location"
        >
          <Navigation className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Coordinates Display */}
      {showCoordinates && !isLoading && (
        <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Latitude:</span>{" "}
              {selectedLocation.lat.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">Longitude:</span>{" "}
              {selectedLocation.lng.toFixed(6)}
            </div>
          </div>
          {userLocation && (
            <div className="mt-1 text-xs text-green-600">
              📍 Using your current location
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isInteractive && !isLoading && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {showUseMyLocationButton &&
            "Click the location button to use your current position, or "}
          Click on the map to select a location
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
