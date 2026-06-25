import React, { useId, useRef, useEffect, useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import "./Textarea.css";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  autoGrow?: boolean;
  showCharCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      autoGrow = false,
      showCharCount = false,
      id,
      className = "",
      disabled,
      readOnly,
      maxLength,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const textareaId = id || defaultId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const counterId = `${textareaId}-counter`;

    const localRef = useRef<HTMLTextAreaElement>(null);

    // Track text length for counter
    const getInitialLength = () => {
      if (value !== undefined) return String(value).length;
      if (defaultValue !== undefined) return String(defaultValue).length;
      return 0;
    };
    const [charCount, setCharCount] = useState(getInitialLength);

    // Sync ref
    const setRefs = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const adjustHeight = useCallback(() => {
      if (localRef.current && autoGrow) {
        localRef.current.style.height = "auto";
        localRef.current.style.height = `${localRef.current.scrollHeight}px`;
      }
    }, [autoGrow]);

    useEffect(() => {
      adjustHeight();
    }, [value, defaultValue, adjustHeight]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    // Determine aria-describedby
    const ariaDescribedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
      showCharCount && maxLength ? counterId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const wrapperClassNames = [
      "ws-field-wrapper",
      fullWidth ? "ws-field-wrapper-full-width" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const textareaContainerClassNames = [
      "ws-textarea-container",
      error ? "ws-textarea-container-invalid" : "",
      disabled ? "ws-textarea-container-disabled" : "",
      readOnly ? "ws-textarea-container-readonly" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const textareaClassNames = [
      "ws-textarea",
      autoGrow ? "ws-textarea-autogrow" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={textareaId} className="ws-field-label">
            {label}
          </label>
        )}

        <div className={textareaContainerClassNames}>
          <textarea
            ref={setRefs}
            id={textareaId}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            onChange={handleTextareaChange}
            value={value}
            defaultValue={defaultValue}
            className={textareaClassNames}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
        </div>

        <div className="ws-field-footer-info">
          {error ? (
            <p id={errorId} className="ws-field-error" role="alert">
              <AlertCircle className="ws-field-error-icon" aria-hidden="true" />
              {error}
            </p>
          ) : helperText ? (
            <p id={helperId} className="ws-field-helper">
              {helperText}
            </p>
          ) : <div />}

          {showCharCount && maxLength && (
            <span
              id={counterId}
              className="ws-field-counter"
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
