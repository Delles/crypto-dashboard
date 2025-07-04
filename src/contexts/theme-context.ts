import { createContext } from "react";

export type ThemeProviderState = {
    theme: string;
    setTheme: (theme: string) => void;
};

export const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

export const ThemeProviderContext =
    createContext<ThemeProviderState>(initialState);
