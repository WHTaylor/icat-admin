import {useState} from "preact/hooks";
import style from './style.css';

const TabWindow = props => {
    const [activeTab, setActiveTab] = useState(null);
    return (
        <div>
            <div class={style.tabSwitcher}>
                {props.children.map((c, i) =>
                    <button
                        onClick={() => setActiveTab(i)}
                        class={i === activeTab ? style.selectedTab : null}>
                        {i + 1}
                    </button>)}
            </div>
            {props.children.map((c, i) =>
                <div class={i === activeTab ? null : style.hidden}>{c}</div>)}
        </div>
    );
}

export default TabWindow;
