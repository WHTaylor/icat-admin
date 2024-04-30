import {ExistingIcatEntity} from "../types";

export type Tool = "MoveRuns";

export type ToolsUIState = {
    activeTool: Tool
    moveRuns: MoveRunsState
}

export type RunRange = {
    start: number
    end: number
}
export type MoveRunsState = {
    instrumentId?: number
    runRanges: RunRange[]
    investigation?: ExistingIcatEntity
}

export function makeNewToolsState() {
    return {
        activeTool: "MoveRuns" as Tool,
        moveRuns: makeMoveRunsState()
    };
}

function makeMoveRunsState() {
    return {
        runRanges: []
    }
}

export type ToolsAction =
    SetActiveToolAction |
    MoveRunsAddRangeAction |
    MoveRunsRemoveRangeAction |
    MoveRunsSetInvestigationAction

type SetActiveToolAction = {
    type: "set_active_tool"
    tool: Tool
}

type MoveRunsAddRangeAction = {
    type: "move_runs_add_range"
    runStart: number
    runEnd: number
}

type MoveRunsRemoveRangeAction = {
    type: "move_runs_remove_range"
    runStart: number
    runEnd: number
}

type MoveRunsSetInvestigationAction = {
    type: "move_runs_set_investigation"
    investigation?: ExistingIcatEntity
}

export function handleToolAction(
    action: ToolsAction, state: ToolsUIState): ToolsUIState {
    if (action.type === "set_active_tool") {
        return {
            ...state,
            activeTool: action.tool
        }
    } else if (action.type === "move_runs_add_range") {
        const coveredBy = state.moveRuns.runRanges.filter(rr =>
            rr.start <= action.runStart && rr.end >= action.runEnd);
        // If new range is already fully covered, don't change anything
        if (coveredBy.length > 0) return state;

        // Check if the new range partially overlaps or is adjacent to other
        // ranges, and merge them if so. There can be at most one on each side.
        // --|leftOverlapping|---------
        // -----------|newRange|-------
        const leftOverlapping = state.moveRuns.runRanges.filter(rr =>
            rr.end >= action.runStart && rr.start < action.runStart);
        // ------|rightOverlapping|----
        // -|newRange|-----------------
        const rightOverlapping = state.moveRuns.runRanges.filter(rr =>
            rr.start <= action.runEnd && rr.end > action.runEnd);
        // --|leftAdjacent|------------
        // ----------------|newRange|--
        const leftAdjacent = state.moveRuns.runRanges.filter(rr =>
            rr.end === action.runStart - 1);
        // ------------|rightAdjacent|-
        // --|newRange|----------------
        const rightAdjacent = state.moveRuns.runRanges.filter(rr =>
            rr.start === action.runEnd + 1);

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
                start: action.runStart,
                end: rightNeighbour.end
            }
        } else if (leftNeighbour !== undefined) {
            merged = {
                start: leftNeighbour.start,
                end: action.runEnd
            }
        } else {
            merged = {
                start: action.runStart,
                end: action.runEnd,
            }
        }

        // We're left with the merged range, and any ranges which were not
        // merged with or covered by the new range
        const notCovered = state.moveRuns.runRanges.filter(rr =>
            rr.start < action.runStart || rr.end > action.runEnd)
            .filter(rr => leftNeighbour === undefined
                || rr.start !== leftNeighbour.start
                || rr.end !== leftNeighbour.end)
            .filter(rr => rightNeighbour === undefined
                || rr.start !== rightNeighbour.start
                || rr.end !== rightNeighbour.end);

        const moveRuns = {
            ...state.moveRuns,
            runRanges: notCovered.concat(merged)
        };
        return {
            ...state,
            moveRuns
        }
    } else if (action.type === "move_runs_remove_range") {
        return {
            ...state,
            moveRuns: {
                ...state.moveRuns,
                runRanges: state.moveRuns.runRanges.filter(
                    rr => rr.start !== action.runStart || rr.end !== action.runEnd)
            }
        };
    } else if (action.type === "move_runs_set_investigation") {
        return {
            ...state,
            moveRuns: {
                ...state.moveRuns,
                investigation: action.investigation
            }
        }
    }

    return state;
}
