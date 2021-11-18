import {useState} from "preact/hooks";
import style from './style.css';

const TabWindow = props => {
    const [activeTab, setActiveTab] = useState(null);

    const handleMouseDown = (ev, i) => {
        // Only want middle mouse clicks
        if (ev.buttons != 4) return;
        ev.preventDefault();
        props.closeTab(i);
    }

    return (
        <div>
            <div class={style.tabSwitcher}>
                {props.children.map(([name, c], i) =>
                    <button
                        onClick={() => setActiveTab(i)}
                        onMouseDown={ev => handleMouseDown(ev, i)}
                        class={i === activeTab ? style.selectedTab : null}>
                        {name}
                    </button>)}
            </div>
            {props.children.map(([name, c], i) =>
                <div class={i === activeTab ? null : style.hidden}>{c}</div>)}
        </div>
    );
}

export default TabWindow;
