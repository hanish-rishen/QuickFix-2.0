"use client";

import { useState, useEffect, FormEvent, useCallback, useRef } from "react"; // Removed useMemo, added useRef
import { useRouter } from "next/navigation";
// Removed react-map-gl imports
// Removed mapbox-gl.css import
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { RepairerProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, AlertCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TOMTOM_API_KEY, reverseGeocode } from "@/lib/tomtom";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, Check } from "lucide-react";

// Declare TomTom SDK type globally to avoid TypeScript errors
declare var tt: any;

// Add predefined skill categories matching the user-side categories
const skillCategories = [
  { id: "electronics", name: "Electronics" },
  { id: "appliances", name: "Appliances" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "jewelry", name: "Jewelry" },
  { id: "automotive", name: "Automotive" },
  { id: "electrical", name: "Electrical" },
  { id: "plumbing", name: "Plumbing" },
  { id: "carpentry", name: "Carpentry" },
  { id: "other", name: "Other" },
];

// Add categoriesList to match the categories from repair-request page
const categoriesList = [
  { id: "electronics", name: "Electronics" },
  { id: "appliances", name: "Appliances" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "jewelry", name: "Jewelry" },
  { id: "automotive", name: "Automotive" },
  { id: "other", name: "Other" },
];

export default function RepairerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { getRepairerProfile, updateRepairerProfile } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Partial<RepairerProfile>>({});
  const [serviceArea, setServiceArea] = useState<number>(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Map State & Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // To hold the TomTom map instance
  const markerRef = useRef<any>(null); // To hold the TomTom marker instance
  const circleRef = useRef<any>(null); // To hold the TomTom circle/polygon instance
  const [markerCoords, setMarkerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isMapSdkLoaded, setIsMapSdkLoaded] = useState(false);

  // --- Helper Functions for Map Elements (Moved Up) ---

  const addOrUpdateMarker = useCallback((lat: number, lng: number) => {
    // Use (window as any).tt
    if (!mapInstanceRef.current || !(window as any).tt) return;

    const position: [number, number] = [lng, lat];

    if (markerRef.current) {
      markerRef.current.setLngLat(position);
    } else {
      const element = document.createElement("div");
      element.className = "tomtom-marker"; // Add custom class for styling if needed
      // Use SVG for better scaling and customization
      element.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" fill="#e53e3e"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      element.style.cursor = "pointer";

      // Use (window as any).tt
      const marker = new (window as any).tt.Marker({
        element: element,
        draggable: true,
        anchor: "bottom",
      })
        .setLngLat(position)
        .addTo(mapInstanceRef.current);

      marker.on("dragend", async () => {
        const newLngLat = marker.getLngLat();
        setMarkerCoords({ latitude: newLngLat.lat, longitude: newLngLat.lng });
        const address = await reverseGeocode(newLngLat.lat, newLngLat.lng);
        setCurrentAddress(address || "Could not find address");
      });

      markerRef.current = marker;
    }
  }, []); // Removed mapInstanceRef from deps as it's a ref

  const addOrUpdateCircle = useCallback(
    (lat: number, lng: number, radiusKm: number) => {
      // Use (window as any).tt
      if (!mapInstanceRef.current || !(window as any).tt) return;

      const map = mapInstanceRef.current;
      const sourceId = "service-area-source";
      const layerId = "service-area-layer";
      const outlineLayerId = "service-area-outline-layer";

      // Function to generate circle points (GeoJSON polygon)
      const createCirclePolygon = (
        centerLat: number,
        centerLng: number,
        radius: number
      ) => {
        const points = 64;
        const coords = [];
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 360;
          const distanceX =
            radius / (111.32 * Math.cos((centerLat * Math.PI) / 180));
          const distanceY = radius / 110.574;
          const pointLng =
            centerLng + distanceX * Math.cos((angle * Math.PI) / 180);
          const pointLat =
            centerLat + distanceY * Math.sin((angle * Math.PI) / 180);
          coords.push([pointLng, pointLat]);
        }
        coords.push(coords[0]); // Close the polygon
        return {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Polygon", coordinates: [coords] },
              properties: {},
            },
          ],
        };
      };

      const geoJsonData = createCirclePolygon(lat, lng, radiusKm);

      // Check if source exists, update data; otherwise, add source and layers
      const source = map.getSource(sourceId);
      if (source) {
        source.setData(geoJsonData);
      } else {
        map.addSource(sourceId, { type: "geojson", data: geoJsonData });
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: { "fill-color": "#007cbf", "fill-opacity": 0.2 },
        });
        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#007cbf",
            "line-width": 1,
            "line-opacity": 0.5,
          },
        });
      }
      circleRef.current = { sourceId, layerId, outlineLayerId }; // Store references if needed for removal
    },
    []
  ); // Removed mapInstanceRef from deps as it's a ref

  // --- Geolocation (Moved Up) ---
  const handleGetCurrentLocation = useCallback(
    (showToast = true) => {
      if (!navigator.geolocation) {
        // Changed variant from 'warning' to 'default'
        if (showToast)
          toast({ title: "Geolocation not supported", variant: "default" });
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerCoords({ latitude, longitude }); // Update state

          // Fly map to new location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 13,
            });
          }

          // Update marker & circle (will be handled by useEffect dependency)
          // addOrUpdateMarker(latitude, longitude); // No need to call directly here
          // addOrUpdateCircle(latitude, longitude, serviceArea); // No need to call directly here

          const address = await reverseGeocode(latitude, longitude);
          setCurrentAddress(address || "Could not find address");
          setIsLocating(false);
          if (showToast)
            toast({ title: "Location Found", description: address || "" });
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (showToast)
            toast({
              title: "Could not get location",
              description: error.message,
              variant: "destructive",
            });
          setIsLocating(false);
        }
      );
    },
    [toast]
  ); // Removed serviceArea from deps

  // --- TomTom SDK Loading ---
  useEffect(() => {
    const loadTomTomSdk = () => {
      // Use (window as any).tt to bypass TS check
      if ((window as any).tt && typeof (window as any).tt === "object") {
        // SDK already loaded
        setIsMapSdkLoaded(true);
        return;
      }

      // Load CSS
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.type = "text/css";
      cssLink.href =
        "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"; // Use specific version
      cssLink.onload = () => {
        // Load JS after CSS
        const script = document.createElement("script");
        script.src =
          "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"; // Use specific version
        script.async = true;
        script.onload = () => {
          console.log("TomTom Maps SDK loaded.");
          setIsMapSdkLoaded(true);
        };
        script.onerror = () => {
          console.error("Failed to load TomTom Maps SDK script.");
          setError("Failed to load map component.");
        };
        document.body.appendChild(script);
      };
      cssLink.onerror = () => {
        console.error("Failed to load TomTom Maps SDK CSS.");
        setError("Failed to load map component styling.");
      };
      document.head.appendChild(cssLink);
    };

    loadTomTomSdk();

    // Cleanup function to remove SDK elements if component unmounts (optional)
    // return () => { ... };
  }, []);

  // --- Map Initialization ---
  useEffect(() => {
    // Use (window as any).tt
    if (
      !isMapSdkLoaded ||
      !mapContainerRef.current ||
      mapInstanceRef.current || // Prevent re-initialization if map already exists
      !(window as any).tt
    ) {
      // Don't initialize if SDK not loaded, container not ready, map exists, or tt not available
      return;
    }
    if (!TOMTOM_API_KEY) {
      setError("Map API Key not configured.");
      setLoading(false); // Stop loading as map cannot be shown
      return;
    }

    console.log("Initializing TomTom Map...");
    try {
      const initialCenter: [number, number] = markerCoords
        ? [markerCoords.longitude, markerCoords.latitude]
        : [-0.1278, 51.5074]; // Default to London if no coords yet
      const initialZoom = markerCoords ? 11 : 9;

      // Initialize map without specifying a style URL - use TomTom defaults
      const map = (window as any).tt.map({
        key: TOMTOM_API_KEY,
        container: mapContainerRef.current,
        center: initialCenter,
        zoom: initialZoom,
        language: "en-GB",
        // No style parameter - let TomTom use the default style
      });

      // Use (window as any).tt
      map.addControl(new (window as any).tt.FullscreenControl());
      map.addControl(new (window as any).tt.NavigationControl());

      // --- Wait for map to load before adding elements ---
      map.on("load", () => {
        console.log("TomTom Map Loaded.");
        mapInstanceRef.current = map; // Set ref only after map is loaded

        // Initialize marker and circle *after* map loads
        if (markerCoords) {
          addOrUpdateMarker(markerCoords.latitude, markerCoords.longitude);
          addOrUpdateCircle(
            markerCoords.latitude,
            markerCoords.longitude,
            serviceArea
          );
        }
        // Add other map event listeners if needed here
        // e.g., map.on('click', ...)
      });

      map.on("error", (e: any) => {
        console.error("Map error:", e);
        // Potentially set an error state specific to map load failure
        if (e?.error?.message.includes("Failed to fetch")) {
          setError("Map style failed to load. Check network or API key.");
        } else {
          setError("An error occurred with the map.");
        }
      });

      // Note: We set mapInstanceRef.current *inside* the 'load' handler now.
      // If you need the ref immediately for other purposes, this might need adjustment.
    } catch (mapError) {
      console.error("Error initializing TomTom map:", mapError);
      // This catch block might catch errors during the initial tt.map() call itself
      setError("Could not initialize the map.");
      setLoading(false); // Stop loading on map init error
    }

    // Cleanup function for the effect
    return () => {
      if (mapInstanceRef.current) {
        console.log("Removing map instance.");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    isMapSdkLoaded,
    // markerCoords, // Marker/Circle are now handled *inside* the load event based on state at that time
    // serviceArea,  // Same as above
    addOrUpdateMarker,
    addOrUpdateCircle,
    // We might need markerCoords and serviceArea if the map *reinitializes*
    // Let's keep them for now, but the initial add is handled by 'load'
    markerCoords,
    serviceArea,
  ]);

  // --- Update marker/circle when coords or serviceArea change (AFTER map is loaded) ---
  useEffect(() => {
    // Only update if map instance exists and marker coordinates are set
    if (mapInstanceRef.current && markerCoords) {
      // Check if map is loaded before trying to update
      if (mapInstanceRef.current.isStyleLoaded()) {
        addOrUpdateMarker(markerCoords.latitude, markerCoords.longitude);
        addOrUpdateCircle(
          markerCoords.latitude,
          markerCoords.longitude,
          serviceArea
        );
      } else {
        // If style not loaded yet, wait for the 'load' event (the initial load handler should cover this)
        // Alternatively, add a one-time listener here, but it might get complex.
        console.log("Map not loaded yet, deferring marker/circle update.");
      }
    }
  }, [markerCoords, serviceArea, addOrUpdateMarker, addOrUpdateCircle]); // Run when these change

  // --- Profile Data Fetching ---
  useEffect(() => {
    // This effect now only fetches profile data, map init is separate
    // Removed isMapSdkLoaded dependency here, map init runs in parallel
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "repairer") {
      router.push("/dashboard");
      return;
    }

    const fetchProfile = async () => {
      setLoading(true); // Keep loading until profile is fetched
      setError(null);
      try {
        const fetchedProfile = await getRepairerProfile(user.id);
        let initialCoords = null;
        let initialAddress = "";
        let initialServiceArea = 10;

        if (fetchedProfile) {
          setProfile(fetchedProfile);
          initialServiceArea = fetchedProfile.serviceArea || 10;
          setServiceArea(initialServiceArea); // Set state here

          // Set categories from profile if they exist
          if (
            fetchedProfile.categories &&
            fetchedProfile.categories.length > 0
          ) {
            setSelectedCategories(fetchedProfile.categories);
          }

          if (fetchedProfile.location) {
            initialCoords = {
              latitude: fetchedProfile.location.latitude,
              longitude: fetchedProfile.location.longitude,
            };
            initialAddress = fetchedProfile.location.address || "";
          }
        } else {
          setProfile({ displayName: user.displayName, email: user.email });
        }

        // Set marker/address state *before* map initialization effect runs
        setMarkerCoords(initialCoords);
        setCurrentAddress(initialAddress);

        if (!initialCoords) {
          handleGetCurrentLocation(false); // Try getting location if none saved
        }
      } catch (err) {
        console.error("Error fetching repairer profile:", err);
        setError("Failed to load profile data.");
        toast({
          title: "Error",
          description: "Could not load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false); // Profile fetch complete
      }
    };

    fetchProfile();
  }, [
    user,
    authLoading,
    // isMapSdkLoaded, // Removed
    getRepairerProfile,
    router,
    toast,
    handleGetCurrentLocation,
  ]);

  // --- Form Submission ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !markerCoords) {
      toast({
        title: "Missing Location",
        description: "Please set your base location on the map.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setError(null);

    const updateData: Partial<RepairerProfile> = {
      categories: selectedCategories, // Add categories to the update data
      serviceArea: serviceArea,
      location: {
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        address: currentAddress,
      },
      // displayName: profile.displayName || user.displayName, // If editable
    };

    try {
      await updateRepairerProfile(user.id, updateData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setProfile((prev) => ({ ...prev, ...updateData }));

      // Redirect to dashboard after successful update
      router.push("/repairer/dashboard");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save profile changes.");
      toast({
        title: "Error",
        description: "Could not save your profile changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Add a function to toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // --- Render Logic ---
  if (loading || authLoading) {
    // Still show loading while profile/auth loads
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Your Repairer Profile</CardTitle>
          <CardDescription>
            Update your skills and service area.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md p-3 flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Display Name (Read-only) */}
            {/* ... existing field ... */}
            <div>
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                value={profile.displayName || user?.displayName || ""}
                disabled
                className="mt-1 bg-gray-100 dark:bg-gray-700"
              />
            </div>

            {/* Email (Read-only) */}
            {/* ... existing field ... */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email || user?.email || ""}
                disabled
                className="mt-1 bg-gray-100 dark:bg-gray-700"
              />
            </div>

            {/* Add categories selection section */}
            <div className="space-y-4 mb-6">
              <Label>Categories of Repairs</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select the categories of items you can repair:
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className={`
                      border rounded-md px-3 py-2 cursor-pointer flex items-center
                      ${
                        selectedCategories.includes(cat.id)
                          ? "bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400"
                          : "border-gray-200 dark:border-gray-700"
                      }
                    `}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <div
                      className={`
                      w-4 h-4 rounded border mr-2 flex items-center justify-center
                      ${
                        selectedCategories.includes(cat.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-400"
                      }
                    `}
                    >
                      {selectedCategories.includes(cat.id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-sm">{cat.name}</span>
                  </div>
                ))}
              </div>

              {selectedCategories.length === 0 && (
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  Please select at least one category to help customers find
                  you.
                </p>
              )}
            </div>

            {/* Service Area & Location */}
            <div className="space-y-4">
              <Label>Service Area & Base Location</Label>
              {/* Map Container */}
              <div
                ref={mapContainerRef}
                className="relative h-96 w-full rounded-md overflow-hidden border bg-gray-200 dark:bg-gray-700" // Added background color
              >
                {/* Show message if map hasn't loaded */}
                {!isMapSdkLoaded && !error && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading
                    Map...
                  </div>
                )}
                {/* Show error if map failed */}
                {error && !loading && (
                  <div className="flex items-center justify-center h-full text-red-600">
                    <AlertCircle className="mr-2 h-5 w-5" /> {error}
                  </div>
                )}
                {/* The map will be injected here by the SDK */}
              </div>
              {/* Controls below the map */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGetCurrentLocation()} // Now declared above
                  disabled={isLocating || !isMapSdkLoaded} // Disable if SDK not loaded
                  className="w-full sm:w-auto"
                >
                  {isLocating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="mr-2 h-4 w-4" />
                  )}
                  Use My Current Location
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Base Address:{" "}
                  {currentAddress ||
                    (markerCoords ? "Getting address..." : "Not set")}
                </p>
                <p className="text-xs text-gray-500">
                  Drag the marker on the map to set your base location.
                </p>
              </div>

              <div>
                <Label htmlFor="serviceAreaSlider">
                  Service Radius: {serviceArea} km
                </Label>
                <Slider
                  id="serviceAreaSlider"
                  min={1}
                  max={100}
                  step={1}
                  value={[serviceArea]}
                  onValueChange={(value) => setServiceArea(value[0])}
                  className="mt-2"
                  disabled={!markerCoords || !isMapSdkLoaded} // Disable if no marker or SDK not loaded
                />
                <p className="text-xs text-gray-500 mt-1">
                  Adjust the slider to set the maximum distance you&apos;ll
                  travel for jobs. The circle on the map shows the area.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={saving || loading || !markerCoords || !isMapSdkLoaded}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
