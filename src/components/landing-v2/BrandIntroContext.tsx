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
  markHeroReady: () => void;
};

const BrandIntroContext = createContext<BrandIntroContextValue>({
  heroReady: false,
  markHeroReady: () => {},
});

export function BrandIntroProvider({ children }: { children: ReactNode }) {
  const [heroReady, setHeroReady] = useState(false);
  const markHeroReady = useCallback(() => {
    setHeroReady((prev) => (prev ? prev : true));
  }, []);

  return (
    <BrandIntroContext.Provider value={{ heroReady, markHeroReady }}>
      {children}
    </BrandIntroContext.Provider>
  );
}

export function useBrandIntro() {
  return useContext(BrandIntroContext);
}
