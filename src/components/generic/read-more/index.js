import style from './style.css';

import {useState} from "preact/hooks";

const MAX_UNSUMMARISED_TEXT = 70;
const ReadMore = ({text}) => {
    const [open, setOpen] = useState(false);

    if (text === undefined) return "";
    else if (typeof text !== "string") return text.toString();
    else if (text.length - 3 < MAX_UNSUMMARISED_TEXT) return text;
    const shownText = open ? text : text.slice(0, MAX_UNSUMMARISED_TEXT - 3);

    return (
        <>
        {shownText}{!open && "..."}
        <button onClick={ev => {ev.stopPropagation(); setOpen(!open)}} class={style.readMoreBtn}>
            {open ? "less" : "show more"}
        </button>
        </>
    );
}

export default ReadMore
