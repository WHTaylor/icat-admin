import {StateCreator} from "zustand/vanilla";

/** The page can be:
 1. The index for the open server connection
 2. The tips page
 3. The about page
 4. The login page (ServerConnector), if undefined */
export type Page = number | "tips" | "about"

type UIState = {
    activePage?: Page
}

type UIActions = {
    setActivePage: (p?: Page) => void
}

export type UISlice = UIState & UIActions

export const createUISlice: StateCreator<UISlice> = (set) => {
    return {
        activePage: undefined,
        setActivePage: (p?: Page) => set((_) => ({activePage: p}))
    }
}