import { useEffect, useRef, useState, useCallback } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { debounce } from "global/helper";
import { FaSpinner } from "react-icons/fa6";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useGoogleMapsAPI } from "./useGoogleMapsAPI";
import Error from "images/icons/error.png";

// Singleton for Google Maps services
let autocompleteService = null;
let placesService = null;

const initializeServices = () => {
  if (!autocompleteService) {
    autocompleteService = new window.google.maps.places.AutocompleteService();
  }
  if (!placesService) {
    placesService = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );
  }
};

const AutocompleteComponent = ({
  label,
  name,
  value,
  onChange,
  selected,
  register,
  errors,
  placeholder,
  required,
  labelClass,
  inputClass,
  disabled,
}) => {
  const { i18n, t } = useTranslation();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const debouncedFetchPredictions = useRef(null);
  const wrapperRef = useRef(null);
  const languageRef = useRef(i18n.language);
  const { isLoaded } = useGoogleMapsAPI();

  // Keep API language in sync with app language (en / ar)
  const apiLanguage = i18n.language === "ar" ? "ar" : "en";
  languageRef.current = apiLanguage;

  const { onChange: registerOnChange, ...restRegister } = register(name, {
    required,
  });

  /**
   * Initialize services when the API is loaded
   */
  useEffect(() => {
    if (isLoaded) {
      initializeServices();
    }
  }, [isLoaded]);

  /**
   * Effect to debounce fetchPredictions function
   */
  useEffect(() => {
    debouncedFetchPredictions.current = debounce((input) => {
      if (!autocompleteService || !input) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      autocompleteService.getPlacePredictions(
        {
          input,
          language: languageRef.current || "en", // en or ar based on app language
        },
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setPredictions(predictions);
          } else {
            setPredictions([]);
          }
          setLoading(false);
        }
      );
    }, 500);
  }, []);

  useEffect(() => {
    checkSpaceAndSetDropdown();
  }, [predictions]);

  const checkSpaceAndSetDropdown = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight =
        predictions.length > 0 ? predictions.length * 48 : 100;
      setDropUp(spaceBelow < dropdownHeight + 20);
    }
  };

  const handleInputChange = useCallback(
    (newValue) => {
      onChange({ input: newValue, selected: null });
      debouncedFetchPredictions.current(newValue);
      registerOnChange({ target: { name, value: newValue } });
      checkSpaceAndSetDropdown();
    },
    [onChange, registerOnChange, name]
  );

  /**
   * Extract address details from Google API response
   */
  const extractAddressComponents = (addressComponents) => {
    let country = "",
      state = "",
      city = "";

    addressComponents.forEach((component) => {
      const types = component.types;
      if (types.includes("country")) country = component.short_name;
      if (types.includes("administrative_area_level_1"))
        state = component.short_name;
      if (
        types.includes("locality") &&
        types.includes("political")
        // types.includes("administrative_area_level_2")
      )
        city = component.short_name;
    });

    return { country, state, city };
  };

  /**
   * Handle place selection from dropdown
   */
  const selectPlace = (selPrediction) => {
    const { place_id, description } = selPrediction;

    if (!placesService) {
      console.error("PlacesService not initialized.");
      return;
    }

    placesService.getDetails(
      { placeId: place_id, language: languageRef.current || "en" },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          console.error("Failed to fetch place details:", status);
          return;
        }

        if (!place || !place.address_components) {
          console.error("Invalid place data:", place);
          return;
        }

        const { country, state, city } = extractAddressComponents(
          place.address_components
        );
        const placeDetails = {
          name: place.name || "",
          address: place.formatted_address || "",
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null,
          country,
          state,
          city,
          place_id: place.place_id || null,
        };

        onChange({ input: description, selected: placeDetails });

        registerOnChange({
          target: { name, value: place.formatted_address || "" },
        });
      }
    );
  };

  const getErrorMessage = () => {
    if (!name) return null;

    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break; // If no error found, break out of the loop
    }
    return error?.message;
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label
          className={`text-sm text-head font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label} <span className="text-red">{required ? "*" : ""}</span>
        </label>
      )}

      <Combobox value={value} onChange={selectPlace} disabled={disabled}>
        <div className="relative">
          <ComboboxInput
            name={name}
            placeholder={placeholder}
            dir={apiLanguage === "ar" ? "rtl" : "ltr"}
            className={`rounded-lg p-[8px_16px] disabled:cursor-not-allowed w-full text-para font-medium h-[46px] border border-[#D0D5DD] bg-[#FAFAFB] transition duration-300 text-sm placeholder:text-gray placeholder:font-normal ${
              inputClass || ""
            } ${errors && errors[name] && "border-red-500"}`}
            onChange={(e) => handleInputChange(e.target.value)}
            {...restRegister}
            disabled={disabled}
          />

          {loading && (
            <span className={`absolute top-4 text-gray-400 text-sm ${apiLanguage === "ar" ? "left-3" : "right-3"}`}>
              <FaSpinner className="animate-spin text-primary" />
            </span>
          )}
        </div>

        <ComboboxOptions
          className={`absolute w-full bg-white shadow-md rounded-lg z-50 ${
            dropUp ? "bottom-full mb-1" : "mt-1"
          }`}
        >
          {predictions.length > 0 ? (
            predictions.map((prediction) => (
              <ComboboxOption
                key={prediction.place_id}
                value={prediction}
                className={`p-2 flex items-start gap-3 cursor-pointer hover:bg-gray-100 ${
                  selected?.place_id === prediction.place_id
                    ? "bg-primary/10 text-primary"
                    : ""
                }`}
              >
                <FaMapMarkerAlt
                  className={`mt-1 ${
                    selected?.place_id === prediction.place_id
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                />
                <div className="text-sm/6 text-head">
                  <strong>{prediction.structured_formatting.main_text}</strong>
                  <div>{prediction.description}</div>
                </div>
              </ComboboxOption>
            ))
          ) : (
            <div className="p-2 text-gray-500 text-sm px-6 py-3">
              {t("no_results_found")}
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="Error" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default AutocompleteComponent;
