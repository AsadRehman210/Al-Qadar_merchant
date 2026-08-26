import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_API_KEY } from "global/config";
import { FaSpinner } from "react-icons/fa6";

const GoogleMaps = ({ height, location, isControl = true }) => {
  const mapStyles = {
    height: height || "400px",
    width: "100%",
  };

  const defaultCenter = {
    lat: location?.latitude || 31.5497, // Latitude for Lahore
    lng: location?.longitude || 74.3436, // Longitude for Lahore
  };

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY, // Replace with your actual API key
  });

  if (loadError) {
    return <p>Error loading maps</p>; // Handle load error
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <FaSpinner className="text-primary animate-spin" />{" "}
      </div>
    ); // Loading state
  }

  return (
    <GoogleMap
      mapContainerStyle={mapStyles}
      center={defaultCenter}
      zoom={13}
      options={{
        disableDefaultUI: !isControl, // Hide default UI elements if disabled
        gestureHandling: !isControl ? "none" : "auto", // Disable gestures
        zoomControl: isControl, // Disable zoom control buttons
      }}
    >
      <Marker position={defaultCenter} />
    </GoogleMap>
  );
};

export default GoogleMaps;
