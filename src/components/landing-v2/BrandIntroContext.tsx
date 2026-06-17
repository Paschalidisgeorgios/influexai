"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type BrandIntroContextValue = {
  heroReady: boolean;
  introDismissed: boolean;
  chromeVisible: boolean;
  markHeroReady: () => void;
  dismissIntro: () => void;
  markChromeVisible: () => void;
};

const BrandIntroContext = createContext<BrandIntroContextValue>({
  heroReady: false,
  introDismissed: false,
  chromeVisible: false,
  markHeroReady: () => {},
  dismissIntro: () => {},
  markChromeVisible: () => {},
});

type BrandIntroProviderProps = {
  children: ReactNode;
  enabled?: boolean;
};

export function BrandIntroProvider({ children, enabled = true }: BrandIntroProviderProps) {
  const [heroReady, setHeroReady] = useState(!enabled);
  const [introDismissed, setIntroDismissed] = useState(!enabled);
  const [chromeVisible, setChromeVisible] = useState(!enabled);

  const markHeroReady = useCallback(() => {
    setHeroReady((prev) => (prev ? prev : true));
  }, []);

  const markChromeVisible = useCallback(() => {
    setChromeVisible(true);
  }, []);

  const dismissIntro = useCallback(() => {
    setIntroDismissed(true);
    setChromeVisible(true);
    setHeroReady(true);
  }, []);

  return (
    <BrandIntroContext.Provider
      value={{
        heroReady,
        introDismissed,
        chromeVisible,
        markHeroReady,
        dismissIntro,
        markChromeVisible,
      }}
    >
      {children}
    </BrandIntroContext.Provider>
  );
}

export function useBrandIntro() {
  return useContext(BrandIntroContext);
}
