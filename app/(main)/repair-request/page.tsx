"use client";

import { useState, useEffect, useRef, DragEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, Loader2, MapPin, Check, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TOMTOM_API_KEY, reverseGeocode } from "@/lib/tomtom";
import { RepairerProfile, RepairStatus } from "@/types";

// Categories from the original file
const categories = [
  { id: "electronics", name: "Electronics" },
  { id: "appliances", name: "Appliances" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "jewelry", name: "Jewelry" },
  { id: "automotive", name: "Automotive" },
  { id: "other", name: "Other" },
];

// Declare TomTom SDK type globally to avoid TypeScript errors
declare var tt: any;

// Define the structure of a repairer for better type safety
interface Repairer {
  id: string;
  displayName?: string;
  skills?: string[];
  categories?: string[]; // Add categories field
  serviceArea?: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Helper function to convert RepairerProfile to Repairer
const convertToRepairer = (profile: RepairerProfile): Repairer => {
  // Ensure location is defined, even if profile.location is undefined
  const location = profile.location || {
    latitude: 0,
    longitude: 0,
    address: "",
  };

  return {
    id: profile.id,
    displayName: profile.displayName,
    skills: profile.skills,
    categories: profile.categories, // Include categories
    serviceArea: profile.serviceArea,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    },
  };
};

// Add type definitions for TomTom API responses
interface TomTomRouteLegPoint {
  latitude: number;
  longitude: number;
}

interface TomTomRouteLeg {
  points: TomTomRouteLegPoint[];
}

interface TomTomRoute {
  legs: TomTomRouteLeg[];
  summary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
  };
}

interface TomTomRouteResponse {
  routes: TomTomRoute[];
  formatVersion?: string;
}

export default function RepairRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageURLs, setImageURLs] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // New states for TomTom Maps and nearby repairers
  const [isMapSdkLoaded, setIsMapSdkLoaded] = useState(false);
  const [nearbyRepairers, setNearbyRepairers] = useState<Repairer[]>([]);
  const [selectedRepairer, setSelectedRepairer] = useState<string | null>(null);
  const [isLoadingRepairers, setIsLoadingRepairers] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const repairerMarkersRef = useRef<any[]>([]);
  const mapInitializedRef = useRef<boolean>(false);

  // Add ref for the route/path
  const routeRef = useRef<any>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createRepairRequest, uploadImage, getNearbyRepairers } =
    useFirebase();

  // Add a function to fetch route data from TomTom Routing API
  const fetchRouteData = useCallback(
    async (
      startLat: number,
      startLng: number,
      endLat: number,
      endLng: number
    ): Promise<TomTomRouteResponse | null> => {
      if (!TOMTOM_API_KEY) {
        console.error("TomTom API key not available");
        return null;
      }

      try {
        // Format URL for the TomTom Routing API with enhanced parameters
        const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?key=${TOMTOM_API_KEY}&traffic=false&travelMode=car&instructionsType=tagged&routeType=fastest`;

        console.log("Fetching route data from TomTom API:", routeUrl);
        const response = await fetch(routeUrl);

        if (!response.ok) {
          throw new Error(`TomTom Routing API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Route data received:", data);
        return data as TomTomRouteResponse;
      } catch (error) {
        console.error("Error fetching route:", error);
        return null;
      }
    },
    [] // TOMTOM_API_KEY is from outside the component, so it's not needed as a dependency
  );

  // Define drawRouteOnMap first, before it's used in showRouteToRepairer
  const drawRouteOnMap = useCallback(
    async (sourceId: string, layerId: string, repairer: Repairer) => {
      if (!mapInstanceRef.current || !location || !repairer.location) return;

      try {
        console.log("Drawing route between:", {
          user: [location.longitude, location.latitude],
          repairer: [repairer.location.longitude, repairer.location.latitude],
        });

        // Remove existing route if any
        if (routeRef.current) {
          try {
            mapInstanceRef.current.removeLayer(routeRef.current.layerId);
            mapInstanceRef.current.removeSource(routeRef.current.sourceId);
          } catch (err) {
            console.error("Error removing existing route:", err);
          }
          routeRef.current = null;
        }

        // Fetch actual route data from TomTom API
        const routeData = await fetchRouteData(
          location.latitude,
          location.longitude,
          repairer.location.latitude,
          repairer.location.longitude
        );

        console.log(
          "Raw route data:",
          JSON.stringify(routeData).substring(0, 500) + "..."
        );

        // Extract route coordinates from the response
        let routeCoordinates: [number, number][] = [];

        if (routeData && routeData.routes && routeData.routes.length > 0) {
          // Get the legs from the first route
          const legs = routeData.routes[0].legs;
          console.log("Route legs found:", legs ? legs.length : 0);

          if (legs && legs.length > 0) {
            // Extract all points from the route
            try {
              routeCoordinates = legs.flatMap((leg: TomTomRouteLeg) => {
                console.log(
                  `Processing leg with ${leg.points?.length || 0} points`
                );
                return (leg.points || [])
                  .map((point: TomTomRouteLegPoint) => {
                    // Ensure we have valid coordinates
                    if (
                      typeof point.longitude !== "number" ||
                      typeof point.latitude !== "number"
                    ) {
                      console.error("Invalid point:", point);
                      return null;
                    }
                    return [point.longitude, point.latitude] as [
                      number,
                      number
                    ];
                  })
                  .filter(Boolean) as [number, number][];
              });
            } catch (e) {
              console.error("Error extracting route coordinates:", e);
            }

            console.log(`Found ${routeCoordinates.length} points in the route`);
            if (routeCoordinates.length > 0) {
              console.log(
                "First few coordinates:",
                routeCoordinates.slice(0, 3)
              );
              console.log("Last few coordinates:", routeCoordinates.slice(-3));
            }
          }
        }

        // If no route found, fallback to straight line
        if (!routeCoordinates || routeCoordinates.length < 2) {
          console.log("No valid route found, using straight line");
          routeCoordinates = [
            [location.longitude, location.latitude],
            [repairer.location.longitude, repairer.location.latitude],
          ];
        }

        // Create a GeoJSON source for the route - use a cleaner structure
        const routeGeoJson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeCoordinates,
              },
              properties: {},
            },
          ],
        };

        // Add visual debugging - log the complete GeoJSON object
        console.log("Route GeoJSON:", routeGeoJson);

        // First check if map instance is still valid
        if (!mapInstanceRef.current) {
          console.error("Map instance no longer available");
          return;
        }

        // Add the source to the map
        try {
          mapInstanceRef.current.addSource(sourceId, {
            type: "geojson",
            data: routeGeoJson,
          });
          console.log(`Added source ${sourceId} to map`);
        } catch (e) {
          console.error("Error adding source:", e);
          // Try to recover by removing any existing source with the same ID
          try {
            if (mapInstanceRef.current.getSource(sourceId)) {
              mapInstanceRef.current.removeSource(sourceId);
              console.log(`Removed conflicting source ${sourceId}`);
              // Try adding again
              mapInstanceRef.current.addSource(sourceId, {
                type: "geojson",
                data: routeGeoJson,
              });
              console.log(`Re-added source ${sourceId} to map`);
            }
          } catch (retryError) {
            console.error("Failed to recover from source error:", retryError);
            throw e; // Re-throw the original error to be caught by outer catch
          }
        }

        // Add a visible route line
        try {
          mapInstanceRef.current.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: "visible",
            },
            paint: {
              "line-color": "#22c55e", // Green color
              "line-width": 6,
              "line-opacity": 0.8, // Slightly less opacity to make it clearer
            },
          });
          console.log(`Added layer ${layerId} to map`);
        } catch (e) {
          console.error("Error adding layer:", e);
          // Try to recover by removing any existing layer with the same ID
          try {
            if (mapInstanceRef.current.getLayer(layerId)) {
              mapInstanceRef.current.removeLayer(layerId);
              console.log(`Removed conflicting layer ${layerId}`);
              // Try adding again
              mapInstanceRef.current.addLayer({
                id: layerId,
                type: "line",
                source: sourceId,
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                  visibility: "visible",
                },
                paint: {
                  "line-color": "#22c55e", // Green color
                  "line-width": 6,
                  "line-opacity": 0.8,
                },
              });
              console.log(`Re-added layer ${layerId} to map`);
            }
          } catch (retryError) {
            console.error("Failed to recover from layer error:", retryError);
            throw e; // Re-throw the original error to be caught by outer catch
          }
        }

        // Force the map to re-render
        try {
          mapInstanceRef.current.triggerRepaint();
          console.log("Triggered map repaint");
        } catch (e) {
          console.error("Error triggering repaint:", e);
        }

        // Store the references
        routeRef.current = { sourceId, layerId };

        // Fit the map to show both user and repairer locations plus the route
        const bounds = new (window as any).tt.LngLatBounds();

        // Add padding for better visualization
        try {
          // Instead of just two points, include all route points in the bounds
          routeCoordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });

          mapInstanceRef.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1000,
          });
          console.log("Map fitted to route bounds");
        } catch (e) {
          console.error("Error fitting map to bounds:", e);
        }

        console.log("Route drawn successfully using actual route data");

        // Show success notification
        toast({
          title: "Route Displayed",
          description:
            "The route to this repairer has been displayed on the map.",
          duration: 2000,
        });
      } catch (err) {
        console.error("Error drawing route on map:", err);
        // Add a fallback method if the above fails
        try {
          console.log("Attempting fallback route display");
          // Simple direct line fallback
          const directLine = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [location.longitude, location.latitude],
                    [repairer.location.longitude, repairer.location.latitude],
                  ],
                },
                properties: {},
              },
            ],
          };

          // Check if source with same ID already exists
          if (mapInstanceRef.current.getSource(sourceId)) {
            mapInstanceRef.current.removeSource(sourceId);
          }

          mapInstanceRef.current.addSource(sourceId, {
            type: "geojson",
            data: directLine,
          });

          // Check if layer with same ID already exists
          if (mapInstanceRef.current.getLayer(layerId)) {
            mapInstanceRef.current.removeLayer(layerId);
          }

          mapInstanceRef.current.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#ff6b6b", // Red for fallback route
              "line-width": 4,
              "line-opacity": 0.7,
              "line-dasharray": [2, 1], // Dashed line for fallback
            },
          });

          routeRef.current = { sourceId, layerId };
          console.log("Fallback direct line route added");

          // Fit bounds to show the direct line
          const fallbackBounds = new (window as any).tt.LngLatBounds()
            .extend([location.longitude, location.latitude])
            .extend([repairer.location.longitude, repairer.location.latitude]);

          mapInstanceRef.current.fitBounds(fallbackBounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1000,
          });

          // Show fallback notification
          toast({
            title: "Basic Route Displayed",
            description: "Showing a direct line to the repairer.",
            variant: "default",
            duration: 2000,
          });
        } catch (fallbackErr) {
          console.error("Even fallback route display failed:", fallbackErr);
          toast({
            title: "Route Display Failed",
            description: "Could not display the route to this repairer.",
            variant: "destructive",
          });
        }
      }
    },
    [location, fetchRouteData, toast]
  );

  // Now define showRouteToRepairer, which uses drawRouteOnMap
  const showRouteToRepairer = useCallback(
    (repairer: Repairer) => {
      console.log("Attempting to show route to repairer:", repairer.id);

      if (!mapInstanceRef.current) {
        console.error("Map instance not available");
        return;
      }

      if (!location) {
        console.error("User location not available");
        return;
      }

      if (!repairer.location) {
        console.error("Repairer location not available");
        return;
      }

      // First remove any existing route
      if (routeRef.current) {
        try {
          mapInstanceRef.current.removeLayer(routeRef.current.layerId);
          mapInstanceRef.current.removeSource(routeRef.current.sourceId);
        } catch (err) {
          console.error("Error removing existing route:", err);
        }
        routeRef.current = null;
      }

      try {
        // Create unique IDs for this route
        const sourceId = `route-source-${repairer.id}-${Date.now()}`;
        const layerId = `route-layer-${repairer.id}-${Date.now()}`;

        // Make sure the map is fully loaded before adding the route
        if (!mapInstanceRef.current.loaded()) {
          console.log("Map not fully loaded, waiting before adding route");
          mapInstanceRef.current.once("load", () => {
            drawRouteOnMap(sourceId, layerId, repairer);
          });
        } else {
          drawRouteOnMap(sourceId, layerId, repairer);
        }
      } catch (err) {
        console.error("Error setting up route:", err);
        toast({
          title: "Route Display Error",
          description:
            "Could not show route to repairer. Please try selecting again.",
          variant: "destructive",
        });
      }
    },
    [location, toast, drawRouteOnMap]
  );

  // Define addRepairerMarker function with showRouteToRepairer already defined
  const addRepairerMarker = useCallback<(repairer: Repairer) => any>(
    (repairer) => {
      if (
        !mapInstanceRef.current ||
        !(
          (window as any).tt && typeof (window as any).tt.Marker === "function"
        ) ||
        !repairer.location
      )
        return;

      const position: [number, number] = [
        repairer.location.longitude,
        repairer.location.latitude,
      ];

      // Create a custom element for the repairer marker
      const element = document.createElement("div");
      element.className = "repairer-location-marker";
      element.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" fill="${
        selectedRepairer === repairer.id ? "#22c55e" : "#ef4444"
      }"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

      try {
        // Create and add the marker
        const marker = new (window as any).tt.Marker({
          element: element,
          anchor: "bottom",
        })
          .setLngLat(position)
          .addTo(mapInstanceRef.current);

        // Create popup with repairer info - update to show categories instead of skills
        const popupContent = `
        <div class="p-2">
          <strong>${repairer.displayName || "Repairer"}</strong>
          <p class="text-sm">${
            repairer.categories
              ?.map((cat) => {
                // Find matching category name
                const category = categories.find((c) => c.id === cat);
                return category ? category.name : cat;
              })
              .join(", ") || "No categories listed"
          }</p>
          <p class="text-xs">Service area: ${repairer.serviceArea || 10} km</p>
          <button id="select-repairer-${
            repairer.id
          }" class="text-xs text-blue-600 font-medium">
            ${
              selectedRepairer === repairer.id
                ? "Selected ✓"
                : "Select this repairer"
            }
          </button>
        </div>
      `;

        const popup = new (window as any).tt.Popup({ offset: 25 })
          .setHTML(popupContent)
          .setLngLat(position);

        // Add popup on click
        marker.getElement().addEventListener("click", () => {
          popup.addTo(mapInstanceRef.current);
        });

        // Add event listener for the select button after the popup is added
        marker.getElement().addEventListener("click", () => {
          setTimeout(() => {
            const selectBtn = document.getElementById(
              `select-repairer-${repairer.id}`
            );
            if (selectBtn) {
              selectBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedRepairer(repairer.id);

                // Show route to the selected repairer
                showRouteToRepairer(repairer);

                // Update markers to reflect selection change
                if (repairerMarkersRef.current.length > 0) {
                  repairerMarkersRef.current.forEach((marker) => {
                    if (marker) marker.remove();
                  });
                  repairerMarkersRef.current = [];
                }

                // Add markers for all repairers again with updated styles
                if (nearbyRepairers.length > 0) {
                  nearbyRepairers.forEach((r) => {
                    addRepairerMarker(r);
                  });
                }

                // Close the popup
                popup.remove();
              });
            }
          }, 100);
        });

        repairerMarkersRef.current.push(marker);
        return marker;
      } catch (error) {
        console.error("Error adding repairer marker:", error);
        return null;
      }
    },
    [selectedRepairer, nearbyRepairers, showRouteToRepairer] // Add showRouteToRepairer to dependencies
  );

  // Now define refreshRepairerMarkers with proper type annotation
  const refreshRepairerMarkers = useCallback((): void => {
    // Remove all existing markers
    if (repairerMarkersRef.current.length > 0) {
      repairerMarkersRef.current.forEach((marker) => {
        if (marker) marker.remove();
      });
      repairerMarkersRef.current = [];
    }

    // Add markers for all repairers again
    if (nearbyRepairers.length > 0) {
      nearbyRepairers.forEach((repairer) => {
        addRepairerMarker(repairer);
      });
    }
  }, [nearbyRepairers, addRepairerMarker]);

  const handleFileChange = (files: FileList | null) => {
    // Modify to accept FileList
    if (files) {
      const filesArray = Array.from(files);
      setImages((prevImages) => [...prevImages, ...filesArray]);

      // Create URLs for preview
      const fileURLs = filesArray.map((file) => URL.createObjectURL(file));
      setImageURLs((prevURLs) => [...prevURLs, ...fileURLs]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImageURLs((prevURLs) => {
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(prevURLs[index]);
      return prevURLs.filter((_, i) => i !== index);
    });
  };

  // Add drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // --- TomTom SDK Loading ---
  useEffect(() => {
    // Only load TomTom SDK when on step 3
    if (step !== 3) return;

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
        "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css";
      cssLink.onload = () => {
        // Load JS after CSS
        const script = document.createElement("script");
        script.src =
          "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js";
        script.async = true;
        script.onload = () => {
          console.log("TomTom Maps SDK loaded.");
          // Small delay to ensure SDK is fully initialized
          setTimeout(() => {
            setIsMapSdkLoaded(true);
          }, 500);
        };
        script.onerror = () => {
          console.error("Failed to load TomTom Maps SDK script.");
          toast({
            title: "Map Error",
            description: "Failed to load map component.",
            variant: "destructive",
          });
        };
        document.body.appendChild(script);
      };
      cssLink.onerror = () => {
        console.error("Failed to load TomTom Maps SDK CSS.");
        toast({
          title: "Map Error",
          description: "Failed to load map component styling.",
          variant: "destructive",
        });
      };
      document.head.appendChild(cssLink);
    };

    loadTomTomSdk();
  }, [step, toast]);

  // Add user marker to the map
  const addUserMarker = useCallback((lat: number, lng: number) => {
    if (
      !mapInstanceRef.current ||
      !((window as any).tt && typeof (window as any).tt.Marker === "function")
    )
      return;

    const position: [number, number] = [lng, lat];

    // Create a custom element for the user marker
    const element = document.createElement("div");
    element.className = "user-location-marker";
    element.innerHTML = `<svg viewBox="0 0 24 24" width="36" height="36" fill="#3b82f6"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

    // Create and add the marker
    try {
      const marker = new (window as any).tt.Marker({
        element: element,
        anchor: "bottom",
      })
        .setLngLat(position)
        .addTo(mapInstanceRef.current);

      // Add a popup to show "Your Location"
      new (window as any).tt.Popup({ offset: 25 })
        .setHTML("<strong>Your Location</strong>")
        .setLngLat(position)
        .addTo(mapInstanceRef.current);

      userMarkerRef.current = marker;
    } catch (error) {
      console.error("Error adding user marker:", error);
    }
  }, []);

  // Fetch nearby repairers from Firestore
  const fetchNearbyRepairers = useCallback(async () => {
    if (!location) return;

    setIsLoadingRepairers(true);
    try {
      // Assuming getNearbyRepairers is a function in Firebase context
      // that takes location, radius, and category as parameters
      const repairerProfiles = await getNearbyRepairers(
        location.latitude,
        location.longitude,
        50, // Increased radius in km to ensure finding nearby repairers
        category // filter by category
      );

      console.log("Found repairers:", repairerProfiles);

      // Convert RepairerProfile[] to Repairer[] to fix type incompatibility
      const repairers = repairerProfiles.map(convertToRepairer);
      setNearbyRepairers(repairers);

      // Add markers for all repairers
      if (mapInstanceRef.current) {
        repairers.forEach((repairer) => {
          addRepairerMarker(repairer);
        });
      }

      if (repairers.length === 0) {
        toast({
          title: "No Repairers Found",
          description:
            "There are no repairers available in your area for this type of repair.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching nearby repairers:", error);
      toast({
        title: "Error",
        description: "Failed to load nearby repairers.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRepairers(false);
    }
  }, [location, category, addRepairerMarker, getNearbyRepairers, toast]);

  // --- Map Initialization ---
  useEffect(() => {
    // Only initialize map when on step 3, SDK is loaded, and we have location
    if (
      step !== 3 ||
      !isMapSdkLoaded ||
      !mapContainerRef.current ||
      mapInstanceRef.current || // Prevent re-initialization if map exists
      !location ||
      mapInitializedRef.current // Add this check to prevent re-attempts
    ) {
      return;
    }

    console.log("Starting map initialization process");

    // Mark that we've attempted to initialize the map
    mapInitializedRef.current = true;

    if (!TOMTOM_API_KEY) {
      toast({
        title: "Configuration Error",
        description: "Map API Key not configured.",
        variant: "destructive",
      });
      return;
    }

    // Store a reference to container element to use in cleanup
    const mapContainer = mapContainerRef.current;

    try {
      if (!mapContainer) return;

      // Initialize map with more resilient error handling
      try {
        // Add debug logging
        console.log("Initializing map...", {
          container: mapContainer,
          location,
          mapExists: !!mapInstanceRef.current,
        });

        const map = (window as any).tt.map({
          key: TOMTOM_API_KEY,
          container: mapContainer,
          center: [location.longitude, location.latitude],
          zoom: 13,
          language: "en-GB",
          // Don't specify a style - use TomTom's default vector style instead
          // The Styles.MAIN constant doesn't exist in this version of the SDK
          stylesVisibility: {
            trafficIncidents: false, // Turn off traffic incidents
            trafficFlow: false, // Turn off traffic flow
            poi: true, // Keep points of interest
          },
          maxPitch: 0, // Keep the map flat (no 3D buildings)
          renderWorldCopies: false, // Don't render multiple copies of the world
        });

        // Store map instance immediately
        mapInstanceRef.current = map;
        console.log("Map instance stored in ref");

        // Add event listeners with error handling
        map.on("load", () => {
          console.log("TomTom Map Loaded Successfully.");

          // Once the map is loaded, explicitly disable any remaining traffic layers
          try {
            // Try to find and hide any traffic-related layers
            const layers = map.getStyle().layers;
            for (const layer of layers) {
              if (
                layer.id.includes("traffic") ||
                layer.id.includes("flow") ||
                layer.id.includes("incident")
              ) {
                map.setLayoutProperty(layer.id, "visibility", "none");
              }
            }
          } catch (e) {
            console.error("Error hiding traffic layers:", e);
          }

          // Only fetch repairers once when map loads
          if (nearbyRepairers.length === 0) {
            // Add user marker with try-catch
            try {
              if (location && location.latitude && location.longitude) {
                addUserMarker(location.latitude, location.longitude);
                // Fetch and display nearby repairers
                fetchNearbyRepairers();
              }
            } catch (markerError) {
              console.error("Error adding user marker:", markerError);
            }
          } else {
            // If we already have repairers, just redisplay them
            addUserMarker(location.latitude, location.longitude);
            refreshRepairerMarkers();
          }
        });

        // Map error handler
        map.on("error", (e: any) => {
          console.error("Map error:", e);
          // Don't remove the map on error, just notify the user
          toast({
            title: "Map Warning",
            description: "The map encountered an issue but may still function.",
            variant: "default",
          });
        });
      } catch (mapError) {
        console.error("Error initializing TomTom map:", mapError);
        toast({
          title: "Map Error",
          description:
            "Could not initialize the map. Please try refreshing the page.",
          variant: "destructive",
        });
        // Reset the initialization flag so we can try again
        mapInitializedRef.current = false;
      }
    } catch (mapError) {
      console.error("Error initializing TomTom map:", mapError);
      toast({
        title: "Map Error",
        description: "Could not initialize the map.",
        variant: "destructive",
      });
      // Reset the initialization flag so we can try again
      mapInitializedRef.current = false;
    }

    // Cleanup function - only runs when the component unmounts or step changes
    return () => {
      // Only clean up if we're leaving step 3 or component is unmounting
      if (mapInstanceRef.current && (step !== 3 || !mapContainer)) {
        console.log(
          "Cleaning up map - component is unmounting or leaving step 3"
        );
        try {
          console.log("Removing map instance");
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error("Error removing map:", err);
        }
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        repairerMarkersRef.current = [];
        // Don't reset mapInitializedRef here, as we want to prevent re-initialization
        // during the same component lifecycle
      } else {
        console.log(
          "Skipping map cleanup - map still needed or already removed"
        );
      }
    };
  }, [
    // These are the only dependencies that should trigger map re-initialization
    step,
    isMapSdkLoaded,
    location,
    toast, // Added missing dependency
    addUserMarker,
    fetchNearbyRepairers,
    nearbyRepairers.length,
    refreshRepairerMarkers,
  ]);

  // Add a separate useEffect for handling operations that depend on the map
  // but shouldn't cause map re-initialization
  useEffect(() => {
    // Only run this if map is already initialized
    if (!mapInstanceRef.current) return;

    console.log("Running map operations for existing map");

    // Check if we have a loaded map and location
    if (mapInstanceRef.current.loaded() && location) {
      // Add user marker
      addUserMarker(location.latitude, location.longitude);

      // Fetch repairers if we don't have any yet
      if (nearbyRepairers.length === 0) {
        fetchNearbyRepairers();
      } else {
        refreshRepairerMarkers();
      }
    }
  }, [
    // Extract the complex expression to a boolean variable that React can check
    !!mapInstanceRef.current, // Changed from mapInstanceRef.current ? true : false
    location,
    addUserMarker,
    fetchNearbyRepairers,
    nearbyRepairers.length,
    refreshRepairerMarkers,
  ]);

  // Add effect to show route when a repairer is selected
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      selectedRepairer &&
      nearbyRepairers.length > 0
    ) {
      const selectedRepairerObj = nearbyRepairers.find(
        (r) => r.id === selectedRepairer
      );
      if (selectedRepairerObj) {
        // Add a slight delay to ensure the map is ready
        setTimeout(() => {
          showRouteToRepairer(selectedRepairerObj);
        }, 100);
      }
    }
  }, [
    selectedRepairer,
    nearbyRepairers,
    showRouteToRepairer,
    location,
    // Removed mapInstanceRef.current from dependencies
  ]);

  // Enhance the existing handleGetLocation function to use TomTom's reverseGeocode
  const handleGetLocation = async () => {
    setIsLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Use TomTom's reverse geocoding service
            const address = await reverseGeocode(latitude, longitude);

            setLocation({
              latitude,
              longitude,
              address: address || "Unknown address",
            });
            setIsLoadingLocation(false);
          } catch (error) {
            console.error("Error getting location address:", error);
            toast({
              title: "Location Error",
              description:
                "Could not determine your address. Please try again.",
              variant: "destructive",
            });
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Error",
            description:
              "Could not get your location. Please enable location services.",
            variant: "destructive",
          });
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
    }
  };

  // Update the handleSubmit function to handle the repairerId correctly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: (
          <div>
            Please{" "}
            <Link href="/login" className="font-medium underline">
              log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-medium underline">
              sign up
            </Link>{" "}
            to submit a repair request.
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images as Base64 strings to Firestore directly
      const uploadedImageUrls = await Promise.all(
        images.map((image, index) => {
          const path = `repair-requests/${user.id}/${Date.now()}-${index}`;
          return uploadImage(image, path);
        })
      );

      // Prepare the request data with proper typing
      const requestData = {
        userId: user.id,
        title,
        description,
        imageUrls: uploadedImageUrls,
        category,
        location: location!,
        // Use properly typed status values
        status: (selectedRepairer
          ? "awaiting_repairer"
          : "pending_diagnosis") as RepairStatus,
      };

      // Only add repairerId if it's selected
      if (selectedRepairer) {
        // Add as a defined property only if selected
        Object.assign(requestData, { repairerId: selectedRepairer });
      }

      // Create repair request in Firestore
      await createRepairRequest(requestData);

      toast({
        title: "Request Submitted!",
        description: selectedRepairer
          ? "Your repair request has been submitted and sent to your selected repairer."
          : "Your repair request has been submitted successfully. We'll analyze it and match you with suitable repairers.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting repair request:", error);
      toast({
        title: "Submission Error",
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep1 = () => {
    if (!title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a title for your repair request.",
        variant: "destructive",
      });
      return false;
    }

    if (!description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the issue with your item.",
        variant: "destructive",
      });
      return false;
    }

    if (!category) {
      toast({
        title: "Missing Information",
        description: "Please select a category for your repair request.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (images.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please upload at least one image of your item.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Modify the validateStep3 function to support optional repairer selection
  const validateStep3 = () => {
    if (!location) {
      toast({
        title: "Missing Information",
        description: "Please set your location to help find nearby repairers.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Add effect to show route when a repairer is selected
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      selectedRepairer &&
      nearbyRepairers.length > 0
    ) {
      const selectedRepairerObj = nearbyRepairers.find(
        (r) => r.id === selectedRepairer
      );
      if (selectedRepairerObj) {
        // Add a slight delay to ensure the map is ready
        setTimeout(() => {
          showRouteToRepairer(selectedRepairerObj);
        }, 100);
      }
    }
  }, [
    selectedRepairer,
    nearbyRepairers,
    showRouteToRepairer,
    location,
    mapInstanceRef.current,
  ]);

  // Modify the cleanup function in map initialization effect to remove route
  useEffect(
    () => {
      // ...existing map initialization code...

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          // ...existing cleanup code...

          // Additionally, remove route if it exists
          if (routeRef.current) {
            try {
              mapInstanceRef.current.removeLayer(routeRef.current.layerId);
              mapInstanceRef.current.removeSource(routeRef.current.sourceId);
            } catch (err) {
              console.error("Error removing route:", err);
            }
            routeRef.current = null;
          }
        }
      };
    },
    [
      // ...existing dependencies...
    ]
  );

  // Update the repairer card click handler for more reliable route display
  const handleRepairerSelection = useCallback(
    (repairer: Repairer) => {
      console.log("Repairer selected:", repairer.id);
      setSelectedRepairer(repairer.id);

      if (!mapInstanceRef.current || !location) {
        console.error("Map not ready or location not set");
        return;
      }

      // Force redraw of all markers to update selection visuals
      refreshRepairerMarkers();

      // Show a toast to indicate route calculation is in progress
      toast({
        title: "Calculating Route",
        description: "Finding the best route to this repairer...",
        duration: 2000,
      });

      // Add a delay before drawing the route to ensure map and markers are ready
      setTimeout(() => {
        // Generate unique IDs for this route calculation
        const timestamp = Date.now();
        const sourceId = `route-source-${repairer.id}-${timestamp}`;
        const layerId = `route-layer-${repairer.id}-${timestamp}`;

        // Call drawRouteOnMap directly
        drawRouteOnMap(sourceId, layerId, repairer);
        console.log("Route drawing initiated with IDs:", sourceId, layerId);
      }, 500); // Increased delay for more reliability
    },
    [refreshRepairerMarkers, drawRouteOnMap, location, toast]
  );

  // Add a dedicated effect to update route when map changes
  useEffect(() => {
    const mapInstance = mapInstanceRef.current;
    if (mapInstance && selectedRepairer && location) {
      const selectedRepairerObj = nearbyRepairers.find(
        (r) => r.id === selectedRepairer
      );
      if (selectedRepairerObj) {
        console.log("Map instance changed - redrawing route");
        showRouteToRepairer(selectedRepairerObj);
      }
    }
  }, [selectedRepairer, nearbyRepairers, location, showRouteToRepairer]); // Use proper dependencies instead of mapInstanceRef.current

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Request a Repair
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Tell us about the item you need repaired, upload photos, and
            we&apos;ll connect you with the right repairer.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  step >= 1 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
            <div className="flex-shrink-0 mx-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                  step >= 1 ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                1
              </div>
            </div>
            <div className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  step >= 2 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
            <div className="flex-shrink-0 mx-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                  step >= 2 ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                2
              </div>
            </div>
            <div className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  step >= 3 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
            <div className="flex-shrink-0 mx-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                  step >= 3 ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-600"
                }`}
              >
                3
              </div>
            </div>
            <div className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  step >= 3 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center w-1/3">Item Details</div>
            <div className="text-center w-1/3">Upload Photos</div>
            <div className="text-center w-1/3">Location & Submit</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Item Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">What item needs repair?</Label>
                  <Input
                    id="title"
                    placeholder="e.g., iPhone 12 with cracked screen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Describe the issue</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible about what's wrong with your item."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Upload Photos */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="block mb-2">Upload Photos</Label>
                  {/* Add drag/drop handlers and dynamic styling */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center transition-colors ${
                      isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : ""
                    }`}
                  >
                    {/* Make the entire content the label */}
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer block"
                    >
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
                        Drag & drop photos here or click to browse
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </span>
                      {/* Button is now just visual, click handled by label */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 pointer-events-none" // Prevent double event trigger
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Files
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => handleFileChange(e.target.files)} // Pass FileList
                    />
                  </div>
                </div>

                {imageURLs.length > 0 && (
                  <div className="mt-4">
                    <Label className="block mb-2">Uploaded Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imageURLs.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            width={200}
                            height={160}
                            className="h-40 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Location & Repairer Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="block mb-2">Your Location</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    We need your location to match you with nearby repairers.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
                    {!location ? (
                      <div className="text-center">
                        <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Share your location to find repairers near you
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGetLocation}
                          disabled={isLoadingLocation}
                          className="mt-4"
                        >
                          {isLoadingLocation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting location...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Get My Location
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start mb-4">
                          <MapPin className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {location.address}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Lat: {location.latitude.toFixed(6)}, Lng:{" "}
                              {location.longitude.toFixed(6)}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleGetLocation}
                              className="mt-2"
                            >
                              Change Location
                            </Button>
                          </div>
                        </div>

                        {/* TomTom Map showing nearby repairers */}
                        <div className="mt-4">
                          <Label className="block mb-2">Nearby Repairers</Label>

                          {/* Map container */}
                          <div
                            ref={mapContainerRef}
                            className="h-[300px] w-full rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 mb-4"
                          >
                            {!isMapSdkLoaded ? (
                              <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                                <span>Loading map...</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Repairer selection list */}
                          <div className="mt-4">
                            <h3 className="text-sm font-medium mb-2">
                              Select a Repairer
                            </h3>

                            {isLoadingRepairers ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                              </div>
                            ) : nearbyRepairers.length === 0 ? (
                              <div className="text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No repairers found in your area for this
                                  category.
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Your request will be analyzed and we&apos;ll
                                  find repairers for you.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {nearbyRepairers.map((repairer) => (
                                  <div
                                    key={repairer.id}
                                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                                      selectedRepairer === repairer.id
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                    onClick={() =>
                                      handleRepairerSelection(repairer)
                                    }
                                  >
                                    <div>
                                      <p className="font-medium text-sm">
                                        {repairer.displayName || "Repairer"}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Categories:{" "}
                                        {repairer.categories
                                          ?.map((cat) => {
                                            const category = categories.find(
                                              (c) => c.id === cat
                                            );
                                            return category
                                              ? category.name
                                              : cat;
                                          })
                                          .join(", ") || "Not specified"}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Distance:{" "}
                                        {calculateDistance(
                                          location.latitude,
                                          location.longitude,
                                          repairer.location.latitude,
                                          repairer.location.longitude
                                        ).toFixed(1)}{" "}
                                        km
                                      </p>
                                    </div>
                                    {selectedRepairer === repairer.id && (
                                      <div className="bg-green-500 text-white p-1 rounded-full">
                                        <Check className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    What happens next?
                  </h3>
                  <ol className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    {selectedRepairer ? (
                      <>
                        <li>
                          1. Your request will be sent to your selected repairer
                        </li>
                        <li>
                          2. They will review your request and confirm if they
                          can help
                        </li>
                        <li>
                          3. Once confirmed, you&apos;ll be able to communicate
                          directly
                        </li>
                        <li>
                          4. After the repair is complete, you&apos;ll pay
                          through our secure system
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          1. Our AI will analyze your item and provide a
                          diagnostic report
                        </li>
                        <li>
                          2. Nearby repairers with matching skills will be
                          notified
                        </li>
                        <li>
                          3. You&apos;ll receive repair offers with pricing and
                          timeline
                        </li>
                        <li>
                          4. Once you select a repairer, they&apos;ll contact
                          you to arrange the repair
                        </li>
                      </>
                    )}
                  </ol>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  Back
                </Button>
              ) : (
                <div></div> // Empty div to maintain spacing with flex-justify-between
              )}

              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || !location}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : selectedRepairer ? (
                    "Submit Request to Selected Repairer"
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate distance between two coordinates using the Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon1 - lon2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
