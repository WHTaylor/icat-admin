import style from './style.module.css';
import CloseButton from "../controls/close-button";
import {useConnectionStore} from "../../state/stores";

type Props = {
    activeTabIdx?: number;
    closeTab: (i: number) => void;
    swapTabs: (a: number, b: number) => void;
    tabs: [table: string, key: number][];
}

/**
 * Displays the list of open {@link EntityTabState}s and allows rearranging and
 * closing them
 */
const TabWindow = (props: Props) => {
    const setActiveTab = useConnectionStore((state) => state.setActiveTab);

    const startDrag = (ev: DragEvent, i: number) => {
        if (!ev.dataTransfer) return;
        ev.dataTransfer.setData("index", i.toString());
        ev.dataTransfer.dropEffect = "move";
    };

    const endDrag = (ev: DragEvent) => {
        if (!ev.dataTransfer) return;
        const numTabsToLeft = getTabXs()
            .filter(x => x < ev.clientX)
            .length;
        const i = Number.parseInt(ev.dataTransfer.getData("index"));
        props.swapTabs(i, Math.max(numTabsToLeft - 1, 0));
    }

    const getTabXs = () =>
        Array.from(document.querySelectorAll(`.${style.tabSwitcher} .${style.entityTab}`))
            .map(el => el.getBoundingClientRect())
            .map(r => r.x);

    return (
        <div
            class={style.tabSwitcher}
            onDragOver={ev => ev.preventDefault()}
            onDrop={endDrag}>
            {props.tabs.map(([table, key], i) =>
                <TabButton
                    key={key}
                    table={table}
                    isActive={i === props.activeTabIdx}
                    changeTab={() => setActiveTab(i)}
                    closeTab={() => props.closeTab(i)}
                    startDrag={ev => startDrag(ev, i)}
                />
            )}
        </div>)
}

type TabButtonProps = {
    table: string
    isActive: boolean
    changeTab: () => void
    closeTab: () => void
    startDrag: (ev: DragEvent) => void
}

const TabButton = (
    {
        table,
        isActive,
        changeTab,
        closeTab,
        startDrag
    }: TabButtonProps) => {
    const classes = style.entityTab
        + (isActive ? " " + style.selectedTab : "");

    const closeOnMiddleClick = (ev: MouseEvent) => {
        if (ev.buttons != 4) return;
        ev.preventDefault();
        closeTab();
    }

    return <div
        draggable={true}
        onDragStart={startDrag}
        onMouseDown={closeOnMiddleClick}
        class={classes}>

        <button onClick={changeTab}>
            {table}
        </button>

        <CloseButton
            onClickHandler={closeTab}
            lineColour="black"
            additionalClass={style.closeButton}
            fillColour={isActive ? undefined : "white"}
        />
    </div>
}

export default TabWindow;
