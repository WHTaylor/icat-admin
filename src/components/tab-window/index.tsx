import style from './style.module.css';
import CloseButton from "../controls/close-button";

type Props = {
    activeTabIdx?: number;
    closeTab: (i: number) => void;
    handleChangeTabIdx: (i: number) => void;
    swapTabs: (a: number, b: number) => void;
    tabs: [table: string, key: number][];
}

/**
 * Displays the list of open {@link EntityTabState}s and allows rearranging and
 * closing them
 */
const TabWindow = (props: Props) => {
    const handleMouseDown = (ev: MouseEvent, i: number) => {
        // Only want middle mouse clicks
        if (ev.buttons != 4) return;
        ev.preventDefault();
        props.closeTab(i);
    }

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
        Array.from(document.querySelectorAll(`.${style.tabSwitcher} .${style.entityTabButton}`))
            .map(el => el.getBoundingClientRect())
            .map(r => r.x);

    const getTabClasses = (i: number) =>
        "entityButton "
        + style.entityTabButton + " "
        + (i === props.activeTabIdx ? style.selectedTab : "");

    return (
        <div
            class={style.tabSwitcher}
            onDragOver={ev => ev.preventDefault()}
            onDrop={endDrag}>
            {props.tabs.map(([table, key], i) =>
                <button
                    key={key}
                    onClick={() => props.handleChangeTabIdx(i)}
                    onMouseDown={ev => handleMouseDown(ev, i)}
                    class={getTabClasses(i)}
                    draggable={true}
                    onDragStart={ev => startDrag(ev, i)}>
                    {table}
                    <CloseButton
                        onClickHandler={() => {
                            props.closeTab(i);
                        }}
                        lineColour="black"
                        additionalClass={style.closeButton}
                        fillColour={i === props.activeTabIdx ? undefined : "white"}
                    />
                </button>)}
        </div>)
}

export default TabWindow;
