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

export function BrandIntroProvider({ children }: { children: ReactNode }) {
  const [heroReady, setHeroReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);

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
