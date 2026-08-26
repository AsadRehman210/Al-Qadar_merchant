import { useState, useEffect } from "react";
import { GOOGLE_API_KEY } from "global/config";

export function useGoogleMapsAPI() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    if (document.getElementById("google-maps-script")) {
      // If the script is already loading, wait for it
      const checkScript = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(checkScript);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps API");
    };

    document.head.appendChild(script);
  }, []);

  return { isLoaded };
}
