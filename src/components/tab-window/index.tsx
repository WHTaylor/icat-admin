import style from './style.module.css';
import CloseButton from "../controls/close-button";
import {useConnectionStore} from "../../state/stores";

/**
 * Displays the list of open {@link EntityTabState}s and allows rearranging and
 * closing them
 */
const TabWindow = () => {
    const tabs = useConnectionStore((state) => state.tabs);
    const setActiveTab = useConnectionStore((state) => state.setActiveTab);
    const activeTab = useConnectionStore((state) => state.activeTab);
    const closeTab = useConnectionStore((state) => state.closeEntityTab);
    const swapTabs = useConnectionStore((state) => state.swapTabs);

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
        swapTabs(i, Math.max(numTabsToLeft - 1, 0));
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
            {tabs.map((tab, i) =>
                <TabButton
                    key={tab.key}
                    table={tab.filter.table}
                    isActive={i === activeTab}
                    changeTab={() => setActiveTab(i)}
                    closeTab={() => closeTab(i)}
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
