import { useState, useEffect, useCallback } from "react";
import { debounce } from "global/helper";
import Input from "components/Input";
import { AiOutlineSearch } from "react-icons/ai";

const SearchInput = ({
  onSearch,
  debounceTime = 500,
  placeholder = "Search",
  initialValue = "",
  className = "",
  inputProps = {},
  label = "",
  prefixText = "",
  inputClass,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (onSearch) onSearch(value);
    }, debounceTime),
    [onSearch, debounceTime]
  );

  // Same space logic as FormInput: trimStart + replace on change; trim (trailing) only on blur
  const formatValue = (value, isBlur = false) => {
    let v = value.trimStart().replace(/\s\s+/g, " ");
    if (isBlur) v = v.trim();
    return v;
  };

  const handleChange = (value) => {
    const formatted = formatValue(value, false);
    setInputValue(formatted);
    debouncedSearch(formatted);
  };

  // // Update the input value if initialValue changes
  // useEffect(() => {
  //   if (initialValue !== inputValue) {
  //     setInputValue(initialValue);
  //   }
  // }, [initialValue]);

  return (
    <div className={`relative ${className}`}>
      <Input
        label={label}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        icon={AiOutlineSearch}
        prefixText={prefixText}
        iconClass="w-5 h-5 text-gray-400"
        {...inputProps}
        className={inputClass}
      />
    </div>
  );
};

export default SearchInput;
