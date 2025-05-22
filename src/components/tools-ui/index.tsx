import MoveRunsTool from "./tools/move-runs";
import IcatClient from "../../icat";
import LeftColumnList from "../left-column-list";
import {useAppStore} from "../../state/store";
import {Tool} from "../../state/toolsSlice";

type Props = {
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
        icatClient
    }: Props) => {
    const activeTool = useAppStore((state) => state.activeTool);
    const setActiveTool = useAppStore((state) => state.setActiveTool);

    return <>
        <LeftColumnList title={"Tools"}>
            {
                toolTabs.map(t =>
                    <li key={t.tool}>
                        <button onClick={() => setActiveTool(t.tool)}>
                            {prettifyToolName(t.tool)}
                        </button>
                    </li>)
            }
        </LeftColumnList>
        <div class="mainContentAndRightColumn">
            {
                activeTool === "MoveRuns"
                    ? <MoveRunsTool icatClient={icatClient}/>
                    : "Unknown tool active"
            }
        </div>
    </>
}

export default ToolsUI;