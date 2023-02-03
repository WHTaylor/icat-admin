import {useEffect, useRef, useState} from "preact/hooks";
import {h} from "preact";

import style from './style.css';

import {entityNames} from '../../icat';
import {TableFilter, tableFilter} from '../../utils';

type ValIdx = [string, number];
function getTable(t: string): string | null {
    if (!t) return null;
    const present = entityNames
        .map(e => [e, e.toLowerCase().indexOf(t!.toLowerCase())])
        .filter((p: ValIdx) => p[1] >= 0)
        .sort((p1: ValIdx, p2: ValIdx) => p1[1] - p2[1])
        .map((p: ValIdx) => p[0])
    return present.length > 0 ? present[0] : null;
}

type Props = {
    openTab: (filter: TableFilter) => void
};
const TableList = ({openTab}: Props) => {
    const [typed, setTyped] = useState("");

    useEffect(() => {
        const readKey = ev => {
            if (document.activeElement !== document.body) return;
            if (ev.altKey || ev.ctrlKey) return;
            if (ev.key === "Escape") {
                setTyped("");
            } else if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                setTyped(typed + ev.key);
            } else if (ev.key === "Backspace") {
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
            <ul class={style.tableList}>
                {entityNames.map(en =>
                    <li key={en}>
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
        <span class={style.suggestion}>{prefix}</span>
        <span class={typedStyle}>{current}</span>
        <span class={style.suggestion}>{suffix}</span>
    </div>;
}

export default TableList
