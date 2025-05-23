import {StateCreator} from "zustand/vanilla";

type UI = "Browser" | "Tools"
type ConnectionUIState = {
    activeUI: UI
}

type ConnectionUIActions = {
    setActiveUI: (ui: UI) => void
}

export type ConnectionUISlice = ConnectionUIState & ConnectionUIActions;

export const createConnectionUISlice: StateCreator<ConnectionUISlice> = (set) => {
    return {
        activeUI: "Browser",
        setActiveUI: (ui: UI) => set(() => ({activeUI: ui}))
    }
}
