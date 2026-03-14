import { createContext, ReactNode, useContext } from 'react';
import { useColorScheme as useReactNativeColorScheme } from 'react-native';

const ColorSchemeContext = createContext<'light' | 'dark' | null | undefined>(null);

const ColorSchemeProvider = function ({ children }: { children?: ReactNode }) {
  const colorScheme = useReactNativeColorScheme();
  return (
    <ColorSchemeContext.Provider value={colorScheme}>
      {children}
    </ColorSchemeContext.Provider>
  );
};

function useColorScheme() {
  return useContext(ColorSchemeContext);
}

export { ColorSchemeProvider, useColorScheme }
