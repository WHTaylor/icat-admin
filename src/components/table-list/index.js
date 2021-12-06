import {useState, useEffect, useRef} from "preact/hooks";

import style from './style.css';
import {entityNames} from '../../icat.js';
import {tableFilter} from '../../utils.js';

function getTable(t) {
    if (!t) return null;
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
            } else if(ev.key === "Backspace") {
                setTyped(typed.slice(0, typed.length - 1));
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
        <TypingPreview current={typed} match={getTable(typed)}/>
        </>
    );
}

const TypingPreview = ({current, match}) => {
    const el = useRef(null);
    useEffect(() => {
        el.current.classList.add(style.active);
        const n = setTimeout(() => el.current.classList.remove(style.active), 900);
        return () => clearTimeout(n);
    });

    const matchLocation = match === null
        ? null
        : match.toLowerCase().indexOf(current.toLowerCase());
    const prefix = match === null ? "" : match.slice(0, matchLocation);
    const suffix = match === null ? "" : match.slice(matchLocation + current.length);
    const typedStyle = match === null ? style.notMatched : style.matched;
    return <div ref={el} class={`${style.typingPreview} ${style.active}`}>
        <span>
            <span class={style.suggestion}>{prefix}</span>
            <span class={typedStyle}>{current}</span>
            <span class={style.suggestion}>{suffix}</span>
        </span>
    </div>;
}

export default TableList
