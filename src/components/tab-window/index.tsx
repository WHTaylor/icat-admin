import {h} from "preact";

import style from './style.css';
import JSX = h.JSX;
import {TableFilter} from "../../utils";

type Props = {
    activeTabIdx: number | null;
    closeTab: (i: number) => void;
    handleChangeTabIdx: (i: number) => void;
    swapTabs: (a: number, b: number) => void;
    entityTables: [TableFilter, JSX.Element][];
    visible: boolean;
}

/** Displays the list of tabs for open entity tables, and the active table */
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
        props.swapTabs(i, numTabsToLeft - 1);
    }

    const getTabXs = () =>
        Array.from(document.querySelectorAll(`.${style.tabSwitcher} button`))
            .map(el => el.getBoundingClientRect())
            .map(r => r.x);

    return (
        <div class="mainContentAndRightColumn">
            {props.visible && props.entityTables.length > 0 &&
                <div
                    class={style.tabSwitcher}
                    onDragOver={ev => ev.preventDefault()}
                    onDrop={endDrag}>
                    {props.entityTables.map(([filter,], i) =>
                        <button
                            key={filter.key}
                            onClick={() => props.handleChangeTabIdx(i)}
                            onMouseDown={ev => handleMouseDown(ev, i)}
                            class={`entityButton ${i === props.activeTabIdx ? style.selectedTab : ""}`}
                            draggable={true}
                            onDragStart={ev => startDrag(ev, i)}>
                            {filter.table}
                        </button>)}
                </div>}
            {props.entityTables.map(([filter, child], i) =>
                <div
                    key={filter.key}
                    class={i === props.activeTabIdx ? "" : "hidden"}>{child}</div>)}
        </div>
    );
}

export default TabWindow;