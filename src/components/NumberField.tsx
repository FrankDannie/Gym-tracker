import { useEffect, useId, useState } from "react";
import { parseNumber } from "../lib/hooks";

interface Props {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

/** Text-based numeric field that only commits valid, in-range values. */
export function NumberField({ label, value, onChange, min = 0, max = 100000, suffix, hint }: Props) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const parsed = parseNumber(text);
  const invalid = parsed === undefined || parsed < min || parsed > max;

  useEffect(() => {
    if (parseNumber(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          className="input num"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseNumber(e.target.value);
            if (n !== undefined && n >= min && n <= max) onChange(n);
          }}
          onBlur={() => setText(String(value))}
        />
        {suffix && <span className="input-suffix faint">{suffix}</span>}
      </div>
      <p id={`${id}-hint`} className={invalid ? "error small" : "faint small"}>
        {invalid ? `Enter a number from ${min} to ${max}.` : (hint ?? "\u00a0")}
      </p>
    </div>
  );
}
