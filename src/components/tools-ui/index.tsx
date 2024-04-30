import {Tool, ToolsUIState} from "../../state/tools";
import {Dispatch} from "preact/hooks";
import {ConnectionStateAction} from "../../state/connection";
import MoveRunsTool from "./tools/move-runs";
import IcatClient from "../../icat";

type Props = {
    state: ToolsUIState
    dispatch: Dispatch<ConnectionStateAction>
    icatClient: IcatClient
}

type Whatevs = {
    title: string
    tool: Tool
}

const toolTabs: Whatevs[] = [{
    title: "Move Runs",
    tool: "MoveRuns"
}];

const ToolsUI = (
    {
        state,
        dispatch,
        icatClient
    }: Props) => {
    const activeTool = state.activeTool === "MoveRuns"
        ? <MoveRunsTool
            icatClient={icatClient}
            dispatch={dispatch}
            state={state.moveRuns}
        />
        : "Oh no"

    return <>
        <div class="leftColumn">
            <h2>Tools</h2>
            <ul>
                {toolTabs.map(t =>
                    <li
                        key={t.tool}
                        onClick={() => dispatch({
                            type: "set_active_tool",
                            tool: t.tool
                        })}
                    >
                        {t.tool}
                    </li>)
                }
            </ul>
        </div>
        <div class="mainContentAndRightColumn">
            {activeTool}
        </div>
    </>
}

export default ToolsUI;