import { createContext, useContext } from 'react';

const NestedScrollContext = createContext(null);

export function useNestedScroll() {
    return useContext(NestedScrollContext);
}

export { NestedScrollContext };
