import {Tool, ToolsUIState} from "../../state/tools";
import {Dispatch} from "preact/hooks";
import {ConnectionStateAction} from "../../state/connection";
import MoveRunsTool from "./tools/move-runs";
import IcatClient from "../../icat";
import LeftColumnList from "../left-column-list";

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

function prettifyToolName(tool: string) {
    const split = tool.match(/[A-Z][a-z]+/g);
    const lowered = split!.map((s, i) => i == 0
        ? s
        : s[0].toLowerCase() + s.slice(1))
    return lowered.join(" ");
}

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
        <LeftColumnList
            title={"Tools"}
            makeChildren={c => toolTabs.map(t =>
                <li key={t.tool}>
                    <button
                        className={c}
                        onClick={() => dispatch({
                            type: "set_active_tool",
                            tool: t.tool
                        })}>
                        {prettifyToolName(t.tool)}
                    </button>
                </li>
            )}/>
        <div class="mainContentAndRightColumn">
            {activeTool}
        </div>
    </>
}

export default ToolsUI;