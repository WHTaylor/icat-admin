import style from './style.css';

/* Displays the list of tabs for open entity tables, and the active table
 */
const TabWindow = props => {
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
        Array.from(document.querySelectorAll( `.${style.tabSwitcher} button`))
            .map(el => el.getBoundingClientRect())
            .map(r => r.x);

    return (
        <div class="mainContentAndRightColumn">
            {props.children.length > 0 &&
            <div
                class={style.tabSwitcher}
                ondragover={ev => ev.preventDefault()}
                ondrop={endDrag} >
                {props.children.map(([name, key, ], i) =>
                    <button
                        key={key}
                        onClick={() => props.handleChangeTab(i)}
                        onMouseDown={ev => handleMouseDown(ev, i)}
                        class={`entityButton
                            ${i === props.activeTab ? style.selectedTab : ""}`}
                        draggable="true"
                        ondragstart={ev => startDrag(ev, i)} >
                        {name}
                    </button>)}
            </div> }
            {props.children.map(([, key, child], i) =>
                <div
                    key={key}
                    class={i === props.activeTab ? "" : "hidden"}>{child}</div>)}
        </div>
    );
}

export default TabWindow;
