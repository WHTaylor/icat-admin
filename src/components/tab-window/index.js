import {useState} from "preact/hooks";
import style from './style.css';

const TabWindow = props => {
    const handleMouseDown = (ev, i) => {
        // Only want middle mouse clicks
        if (ev.buttons != 4) return;
        ev.preventDefault();
        props.closeTab(i);
    }

    return (
        <div class="mainContentAndRightColumn">
            <div class={style.tabSwitcher}>
                {props.children.map(([name, c], i) =>
                    <button
                        onClick={() => props.handleChangeTab(i)}
                        onMouseDown={ev => handleMouseDown(ev, i)}
                        class={`entityButton
                            ${i === props.activeTab ? style.selectedTab : ""}`}>
                        {name}
                    </button>)}
            </div>
            {props.children.map(([name, c], i) =>
                <div class={i === props.activeTab ? "" : "hidden"}>{c}</div>)}
        </div>
    );
}

export default TabWindow;
