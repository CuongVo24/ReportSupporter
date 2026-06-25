import React, { useId } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  name?: string;
  required?: boolean;
  fullWidth?: boolean;
  size?: "md" | "sm";
  leadingIcon?: React.ReactNode;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  placeholder = "Chọn một tùy chọn...",
  value,
  defaultValue,
  onValueChange,
  options,
  disabled = false,
  name,
  required,
  fullWidth = true,
  size = "md",
  leadingIcon,
  id,
}) => {
  const defaultId = useId();
  const selectId = id || defaultId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const ariaDescribedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const wrapperClassNames = [
    "ws-field-wrapper",
    fullWidth ? "ws-field-wrapper-full-width" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const triggerClassNames = [
    "ws-select-trigger",
    `ws-select-trigger-${size}`,
    error ? "ws-select-trigger-invalid" : "",
    leadingIcon ? "ws-select-trigger-with-leading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassNames}>
      {label && (
        <label id={`${selectId}-label`} htmlFor={selectId} className="ws-field-label">
          {label}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <div className="ws-select-container">
          {leadingIcon && (
            <span className="ws-select-leading-icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}

          <RadixSelect.Trigger
            id={selectId}
            className={triggerClassNames}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            aria-describedby={ariaDescribedBy}
            aria-invalid={error ? "true" : undefined}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon className="ws-select-icon-wrapper">
              <ChevronDown className="ws-select-chevron" aria-hidden="true" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
        </div>

        <RadixSelect.Portal>
          <RadixSelect.Content className="ws-select-content" position="popper" sideOffset={4}>
            <RadixSelect.Viewport className="ws-select-viewport">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="ws-select-item"
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ws-select-item-indicator">
                    <Check className="ws-select-item-check" aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error ? (
        <p id={errorId} className="ws-field-error" role="alert">
          <span className="ws-field-error-icon" aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="ws-field-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
