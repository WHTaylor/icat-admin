import {useState} from "preact/hooks";
import style from './style.css';

const TabWindow = props => {
    const [activeTab, setActiveTab] = useState(null);
    return (
        <div>
            <div class={style.tabSwitcher}>
                {props.children.map(([name, c], i) =>
                    <button
                        onClick={() => setActiveTab(i)}
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
