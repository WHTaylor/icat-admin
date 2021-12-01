import {useState, useEffect, useRef} from "preact/hooks";

import style from './style.css';
import {entityNames} from '../../icat.js';
import {tableFilter} from '../../utils.js';

function getTable(t) {
    const present = entityNames
        .map(e => [e, e.toLowerCase().indexOf(t.toLowerCase())])
        .filter(p => p[1] >= 0)
        .sort((p1, p2) => p1[1] - p2[1])
        .map(p => p[0])
    return present.length > 0 ? present[0] : null;
}

const TableList = ({openTab}) => {
    const [typed, setTyped] = useState("");

    useEffect(() => {
        const readKey = ev => {
            if (document.activeElement !== document.body) return;
            if (ev.key === "Escape") {
                setTyped("");
            } else if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                setTyped(typed + ev.key);
            } else if (ev.key == "Enter" && typed !== "") {
                const toOpen = getTable(typed);
                if (toOpen !== null) {
                    openTab(tableFilter(toOpen, 0, 50));
                    setTyped("");
                }
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    });

    return (
        <>
        <h2>ICAT tables</h2>
        <ul>
            {entityNames.map(en =>
                <li>
                    <button
                        class="entityButton"
                        onClick={() => openTab(tableFilter(en, 0, 50))}>
                        {en}
                    </button>
                </li>)}
        </ul>
        </>
    );
}

export default TableList
