import {h, Fragment} from "preact";
import {useState} from "preact/hooks";

import style from './style.css';

const MAX_UNSUMMARISED_TEXT = 70;

type Props = {
    text: string | undefined | number | Date;
}

/**
 * Toggle for hiding text longer than {@link MAX_UNSUMMARISED_TEXT} characters
 */
const ReadMore = ({text}: Props) => {
    const [open, setOpen] = useState(false);

    if (text === undefined) return <></>;
    else if (typeof text !== "string") return <>{text.toString()}</>;
    else if (text.length - 3 < MAX_UNSUMMARISED_TEXT) return <>{text}</>;
    const shownText = open ? text : text.slice(0, MAX_UNSUMMARISED_TEXT - 3);

    return (
        <>
            {shownText}{!open && "..."}
            <button onClick={ev => {
                ev.stopPropagation();
                setOpen(!open)
            }} class={style.readMoreBtn}>
                {open ? "less" : "show more"}
            </button>
        </>
    );
}

export default ReadMore
