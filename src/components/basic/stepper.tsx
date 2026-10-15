import { Minus, Plus } from "lucide-react";
import { useId, useState, useEffect } from "react";
import { IconButton } from "./button";
import { Input } from "./input";
import type { FieldProps } from "./field";

export type StepperProps = FieldProps & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  id?: string;
  name?: string;
};

function decimalPlaces(value: number) {
  const [base, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.max(0, (base.split(".")[1]?.length ?? 0) - Number(exponent));
}

export function Stepper({
  label,
  value,
  onValueChange,
  min = 0,
  max,
  step = 1,
  isDisabled = false,
  isReadOnly = false,
  description,
  error,
  id,
  name,
}: StepperProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  const upperBound = Math.max(min, max ?? Infinity);
  const precision = Math.min(
    12,
    Math.max(decimalPlaces(increment), decimalPlaces(min)),
  );
  const normalize = (next: number) => {
    const aligned = min + Math.round((next - min) / increment) * increment;
    return Math.min(
      upperBound,
      Math.max(min, Number(aligned.toFixed(precision))),
    );
  };
  const currentValue = normalize(Number.isFinite(value) ? value : min);
  const [draft, setDraft] = useState(() => String(currentValue));
  useEffect(() => setDraft(String(currentValue)), [currentValue]);
  const hasDraftNumber = draft.trim() !== "" && Number.isFinite(Number(draft));
  const draftValue = hasDraftNumber ? normalize(Number(draft)) : currentValue;
  const canDecrease = !isDisabled && !isReadOnly && draftValue > min;
  const canIncrease = !isDisabled && !isReadOnly && draftValue < upperBound;
  const apply = (next: number) => {
    const normalized = normalize(next);
    setDraft(String(normalized));
    if (normalized !== value) onValueChange(normalized);
  };
  return (
    <div className="gc-field gc-stepper">
      <label htmlFor={inputId}>{label}</label>
      <div
        className="gc-stepper-control"
        data-disabled={isDisabled || undefined}
      >
        <IconButton
          label={`${label} 줄이기`}
          disabled={!canDecrease}
          onClick={() => apply(draftValue - increment)}
        >
          <Minus size={18} aria-hidden="true" />
        </IconButton>
        <Input
          id={inputId}
          name={name}
          type="number"
          inputMode="decimal"
          className="gc-stepper-input"
          value={draft}
          min={min}
          max={Number.isFinite(upperBound) ? upperBound : undefined}
          step={increment}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={!!error}
          aria-describedby={
            error || description ? `${inputId}-help` : undefined
          }
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (!isDisabled && !isReadOnly) apply(draftValue);
          }}
          onKeyDown={(event) => {
            if (isDisabled || isReadOnly) return;
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              apply(
                draftValue + (event.key === "ArrowUp" ? increment : -increment),
              );
            } else if (
              event.key === "Home" ||
              (event.key === "End" && Number.isFinite(upperBound))
            ) {
              event.preventDefault();
              apply(event.key === "Home" ? min : upperBound);
            } else if (event.key === "Enter") {
              event.preventDefault();
              apply(draftValue);
            }
          }}
        />
        <IconButton
          label={`${label} 늘리기`}
          disabled={!canIncrease}
          onClick={() => apply(draftValue + increment)}
        >
          <Plus size={18} aria-hidden="true" />
        </IconButton>
      </div>
      {(error || description) && (
        <small
          id={`${inputId}-help`}
          className={error ? "gc-error" : "gc-help"}
        >
          {error || description}
        </small>
      )}
    </div>
  );
}
