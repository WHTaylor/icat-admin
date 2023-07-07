import style from './style.css';
import {TableFilter} from "../../utils";

type Props = {
    activeTabIdx: number | null;
    closeTab: (i: number) => void;
    handleChangeTabIdx: (i: number) => void;
    swapTabs: (a: number, b: number) => void;
    tabFilters: TableFilter[];
}

/**
 * Displays the list of tabs for open {@link EntityTable}s
 */
const TabWindow = (props: Props) => {
    const handleMouseDown = (ev, i) => {
        // Only want middle mouse clicks
        if (ev.buttons != 4) return;
        ev.preventDefault();
        props.closeTab(i);
    }

    const startDrag = (ev, i) => {
        ev.dataTransfer.setData("index", i);
        ev.dataTransfer.dropEffect = "move";
    };

    const endDrag = ev => {
        const numTabsToLeft = getTabXs()
            .filter(x => x < ev.clientX)
            .length;
        const i = Number.parseInt(ev.dataTransfer.getData("index"));
        props.swapTabs(i, Math.max(numTabsToLeft - 1, 0));
    }

    const getTabXs = () =>
        Array.from(document.querySelectorAll(`.${style.tabSwitcher} button`))
            .map(el => el.getBoundingClientRect())
            .map(r => r.x);

    return (
        <div
            class={style.tabSwitcher}
            onDragOver={ev => ev.preventDefault()}
            onDrop={endDrag}>
            {props.tabFilters.map((filter, i) =>
                <button
                    key={filter.key}
                    onClick={() => props.handleChangeTabIdx(i)}
                    onMouseDown={ev => handleMouseDown(ev, i)}
                    class={`entityButton ${i === props.activeTabIdx ? style.selectedTab : ""}`}
                    draggable={true}
                    onDragStart={ev => startDrag(ev, i)}>
                    {filter.table}
                </button>)}
        </div>)
}

export default TabWindow;
