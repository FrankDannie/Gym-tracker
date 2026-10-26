import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Show = (message: string) => void;
const ToastContext = createContext<Show>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<number>();

  const show = useCallback<Show>((m) => {
    setMessage(m);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {visible && <div className="toast">{message}</div>}
      </div>
    </ToastContext.Provider>
  );
}
