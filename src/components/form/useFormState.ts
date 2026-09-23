import { useEffect, useRef } from 'react';

/** What a form reports to the screen hosting it, so the screen can put the confirming action in
 * its navigation bar and guard against leaving with unsaved changes. */
export interface FormState<T> {
  value: T;
  canSubmit: boolean;
  isDirty: boolean;
}

/** Reports the form's current value, validity, and whether it differs from how it started. */
export function useReportFormState<T>(value: T, canSubmit: boolean, onStateChange: (state: FormState<T>) => void) {
  const serialized = JSON.stringify(value);
  const initial = useRef(serialized);
  useEffect(() => {
    onStateChange({ value, canSubmit, isDirty: serialized !== initial.current });
    // `value` is represented by `serialized`; re-running on identity changes alone would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, canSubmit, onStateChange]);
}
