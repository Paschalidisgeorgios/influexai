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
  markHeroReady: () => void;
  dismissIntro: () => void;
};

const BrandIntroContext = createContext<BrandIntroContextValue>({
  heroReady: false,
  introDismissed: false,
  markHeroReady: () => {},
  dismissIntro: () => {},
});

export function BrandIntroProvider({ children }: { children: ReactNode }) {
  const [heroReady, setHeroReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);

  const markHeroReady = useCallback(() => {
    setHeroReady((prev) => (prev ? prev : true));
  }, []);

  const dismissIntro = useCallback(() => {
    setIntroDismissed(true);
    setHeroReady(true);
  }, []);

  return (
    <BrandIntroContext.Provider
      value={{ heroReady, introDismissed, markHeroReady, dismissIntro }}
    >
      {children}
    </BrandIntroContext.Provider>
  );
}

export function useBrandIntro() {
  return useContext(BrandIntroContext);
}
