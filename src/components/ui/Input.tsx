import React, { useId } from "react";
import "./Input.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      leadingIcon,
      trailingIcon,
      id,
      className = "",
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine aria-describedby
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

    const inputContainerClassNames = [
      "ws-field-container",
      error ? "ws-field-container-invalid" : "",
      disabled ? "ws-field-container-disabled" : "",
      readOnly ? "ws-field-container-readonly" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const inputClassNames = [
      "ws-input",
      leadingIcon ? "ws-input-with-leading" : "",
      trailingIcon ? "ws-input-with-trailing" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className="ws-field-label">
            {label}
          </label>
        )}
        
        <div className={inputContainerClassNames}>
          {leadingIcon && (
            <span className="ws-field-icon ws-field-leading-icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            readOnly={readOnly}
            className={inputClassNames}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={ariaDescribedBy}
            {...props}
          />

          {trailingIcon && (
            <span className="ws-field-icon ws-field-trailing-icon" aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </div>

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
  }
);

Input.displayName = "Input";
