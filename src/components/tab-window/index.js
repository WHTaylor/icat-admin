import style from './style.css';

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
            <div
                class={style.tabSwitcher}
                ondragover={ev => ev.preventDefault()}
                ondrop={endDrag} >
                {props.children.map(([name], i) =>
                    <button
                        // This key relies on order, so isn't great, but better than
                        // nothing
                        key={name + i}
                        onClick={() => props.handleChangeTab(i)}
                        onMouseDown={ev => handleMouseDown(ev, i)}
                        class={`entityButton
                            ${i === props.activeTab ? style.selectedTab : ""}`}
                        draggable="true"
                        ondragstart={ev => startDrag(ev, i)} >
                        {name}
                    </button>)}
            </div>
            {props.children.map(([name, child], i) =>
                <div
                    // This key relies on order, so isn't great, but better than
                    // nothing
                    key={name + i}
                    class={i === props.activeTab ? "" : "hidden"}>{child}</div>)}
        </div>
    );
}

export default TabWindow;
