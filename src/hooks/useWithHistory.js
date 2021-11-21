import {useState} from "preact/hooks";

export default function useWithHistory(current, setCurrent) {
    const [history, setHistory] = useState([]);
    const [index, setIndex] = useState(null);

    const undo = () => {
        if (index === null) return;
        const newIndex = index > 0 ? index - 1 : null;
        setIndex(newIndex);
        setCurrent(newIndex === null ? null : history[newIndex]);
    }

    const redo = () => {
        if (history.length === 0 || index == history.length - 1) return;
        const newIndex = index === null ? 0 : index + 1;
        setIndex(newIndex);
        setCurrent(history[newIndex]);
    }

    const setAndAddToHistory = newCurrent => {
        const historyCut = index === null ? 0 : index + 1;
        setHistory(history.slice(0, historyCut).concat([newCurrent]));
        setCurrent(newCurrent);
        setIndex(historyCut);
    }

    return [setAndAddToHistory, undo, redo];
}
