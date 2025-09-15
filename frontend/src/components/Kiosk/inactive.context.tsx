import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

interface InactiveContextProps {
  stop: () => void;
  start: () => void;
}

const InactiveContext = createContext<InactiveContextProps | null>(null);

export const InactiveContextProvider = ({
  children,
  stop,
  start,
}: PropsWithChildren<InactiveContextProps>) => {
  return (
    <InactiveContext.Provider
      value={{
        start,
        stop,
      }}
    >
      {children}
    </InactiveContext.Provider>
  );
};

export const useInactiveContext = () => {
  const context = useContext(InactiveContext);
  if (context == null) throw new Error("must use with InactiveContextProvider");

  return context;
};

const IDLE_TIMEOUT = 60 * 1000;
const INACTIVE_WARNING_TIMEOUT = 45 * 1000;
export const useInactiveDectector = ({
  onIdle,
  onWarningBeforeIdle,
  idleTimeoutSecond = IDLE_TIMEOUT,
  idleWarningTimeoutSecond = INACTIVE_WARNING_TIMEOUT,
}: {
  onIdle: () => void;
  onWarningBeforeIdle: () => void;
  idleTimeoutSecond: number;
  idleWarningTimeoutSecond: number;
}) => {
  const idleTimerRef = useRef<string | number | null>(null);
  const inactiveWarningTimerRef = useRef<string | number | null>(null);
  const stopCheckRef = useRef(false);

  const stopInactivityTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (inactiveWarningTimerRef.current)
      clearTimeout(inactiveWarningTimerRef.current);
  }, []);

  const startInactivityTimer = useCallback(() => {
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, idleTimeoutSecond) as any;

    inactiveWarningTimerRef.current = setTimeout(() => {
      onWarningBeforeIdle();
    }, idleWarningTimeoutSecond) as any;
  }, [
    onIdle,
    onWarningBeforeIdle,
    idleTimeoutSecond,
    idleWarningTimeoutSecond,
  ]);

  const resetInactivityTimer = useCallback(() => {
    stopInactivityTimer();
    if (stopCheckRef.current) return;

    startInactivityTimer();
  }, [stopInactivityTimer, startInactivityTimer]);

  // 1분동안 사용자 조작이 없을 시 setIsAdOpen(true)
  useEffect(() => {
    window.addEventListener("load", resetInactivityTimer);
    document.addEventListener("mousemove", resetInactivityTimer);
    document.addEventListener("mousedown", resetInactivityTimer);
    document.addEventListener("keypress", resetInactivityTimer);
    document.addEventListener("scroll", resetInactivityTimer);
    document.addEventListener("touchstart", resetInactivityTimer);

    return () => {
      window.removeEventListener("load", resetInactivityTimer);
      document.removeEventListener("mousemove", resetInactivityTimer);
      document.removeEventListener("mousedown", resetInactivityTimer);
      document.removeEventListener("keypress", resetInactivityTimer);
      document.removeEventListener("scroll", resetInactivityTimer);
      document.removeEventListener("touchstart", resetInactivityTimer);
    };
  }, [resetInactivityTimer]);

  const stop = useCallback(() => {
    stopCheckRef.current = true;
    stopInactivityTimer();
  }, [stopInactivityTimer]);

  const start = useCallback(() => {
    stopCheckRef.current = false;
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  return {
    start,
    stop,
  };
};
