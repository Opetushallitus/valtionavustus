import React, { useContext } from "react";
import { ValueType } from "./types";

interface CodeTabContext {
  selectedTab: ValueType;
  setSelectedTab: React.Dispatch<React.SetStateAction<ValueType>>;
}

export const CodeTabContext = React.createContext<CodeTabContext | null>(null);

export const useCodeTabContext = () => {
  const context = useContext(CodeTabContext);
  if (!context) {
    throw new Error(
      "CodeTabContext is not available. Did you remember to wrap the component in CodeTabContext Provider?"
    );
  }
  return context;
};
