import { createContext, useContext } from 'react';

export const MindmapActionsContext = createContext(null);

export function useMindmapActions() {
  return useContext(MindmapActionsContext);
}
