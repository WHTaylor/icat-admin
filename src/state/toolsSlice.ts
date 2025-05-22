import {StateCreator} from "zustand/vanilla";
import {ExistingIcatEntity} from "../types";

export type Tool = "MoveRuns";

export type RunRange = {
    start: number
    end: number
}
type MoveRunsState = {
    instrumentId?: number
    runRanges: RunRange[]
    instrument?: string
    investigation?: ExistingIcatEntity
}

type ToolsState = {
    activeTool: Tool
    moveRuns: MoveRunsState
}

type ToolsActions = {
    setActiveTool: (t: Tool) => void
    setMoveRunsInstrument: (i: string) => void
    setMoveRunsInvestigation: (i?: ExistingIcatEntity) => void
    addMoveRunsRange: (r: RunRange) => void
    removeMoveRunsRange: (r: RunRange) => void
}

export type ToolsSlice = ToolsState & ToolsActions

export const createToolsSlice: StateCreator<ToolsSlice> = (set, get) => {
    return {
        activeTool: "MoveRuns",
        moveRuns: {
            runRanges: []
        },
        setActiveTool: (t: Tool) => set(() => ({activeTool: t})),
        setMoveRunsInstrument: (i: string) => set((state) => ({
            moveRuns: {
                ...state.moveRuns,
                instrument: i
            }
        })),
        setMoveRunsInvestigation: (i?: ExistingIcatEntity) => set((state) => ({
            moveRuns: {
                ...state.moveRuns,
                investigation: i
            }
        })),
        addMoveRunsRange: (r: RunRange) => {
            const current = get().moveRuns.runRanges;
            const coveredBy = current.filter(rr =>
                rr.start <= r.start && rr.end >= r.end);

            // If new range is already fully covered, don't change anything
            if (coveredBy.length > 0) return get();

            // Check if the new range partially overlaps or is adjacent to other
            // ranges, and merge them if so. There can be at most one on each side.
            // --|leftOverlapping|---------
            // -----------|newRange|-------
            const leftOverlapping = current.filter(rr =>
                rr.end >= r.start && rr.start < r.start);
            // ------|rightOverlapping|----
            // -|newRange|-----------------
            const rightOverlapping = current.filter(rr =>
                rr.start <= r.end && rr.end > r.end);
            // --|leftAdjacent|------------
            // ----------------|newRange|--
            const leftAdjacent = current.filter(rr =>
                rr.end === r.start - 1);
            // ------------|rightAdjacent|-
            // --|newRange|----------------
            const rightAdjacent = current.filter(rr =>
                rr.start === r.end + 1);

            const leftNeighbour = leftOverlapping.length > 0
                ? leftOverlapping[0]
                : leftAdjacent.length > 0
                    ? leftAdjacent[0]
                    : undefined;
            const rightNeighbour = rightOverlapping.length > 0
                ? rightOverlapping[0]
                : rightAdjacent.length > 0
                    ? rightAdjacent[0]
                    : undefined;
            let merged;
            if (rightNeighbour !== undefined && leftNeighbour !== undefined) {
                merged = {
                    start: leftNeighbour.start,
                    end: rightNeighbour.end
                }
            } else if (rightNeighbour !== undefined) {
                merged = {
                    start: r.start,
                    end: rightNeighbour.end
                }
            } else if (leftNeighbour !== undefined) {
                merged = {
                    start: leftNeighbour.start,
                    end: r.end
                }
            } else {
                merged = {
                    start: r.start,
                    end: r.end,
                }
            }

            // We're left with the merged range, and any ranges which were not
            // merged with or covered by the new range
            const notCovered = current.filter(rr =>
                rr.start < r.start || rr.end > r.end)
                .filter(rr => leftNeighbour === undefined
                    || rr.start !== leftNeighbour.start
                    || rr.end !== leftNeighbour.end)
                .filter(rr => rightNeighbour === undefined
                    || rr.start !== rightNeighbour.start
                    || rr.end !== rightNeighbour.end);

            set((state) => ({
                moveRuns: {
                    ...state.moveRuns,
                    runRanges: notCovered.concat(merged)
                }
            }));
        },
        removeMoveRunsRange: (r: RunRange) => set((state) => ({
            moveRuns: {
                ...state.moveRuns,
                runRanges: state.moveRuns.runRanges.filter(
                    rr => r.start !== r.start || rr.end !== r.end
                )
            }
        }))
    }
}
