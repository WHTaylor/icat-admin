import style from './style.css';

import {useState} from "preact/hooks";

const MAX_UNSUMMARISED_TEXT = 70;
const ReadMore = ({text, maxUnsummarizedLength}) => {
    const [open, setOpen] = useState(false);

    if (text.length - 3 < maxUnsummarizedLength) return text;
    const shownText = open ? text : text.slice(0, maxUnsummarizedLength - 3);
    return (
        <>
        {shownText}{!open && "..."}
        <button onClick={() => setOpen(!open)} class={style.readMoreBtn}>
            {open ? "less" : "show more"}
        </button>
        </>
    );
}

export default ReadMore
