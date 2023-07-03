import {useEffect, useState, useRef} from "preact/hooks";
import {h, Fragment} from "preact";

import style from './style.css';

const INTERVAL_MS = 10

type MousePos = { x: number, y: number };

type SaveState = {
    failed: boolean;
    isSaving?: boolean;
    clear: () => void;
    message: string;
};

type Props = {
    saveState: SaveState;
    clearTimeoutMs?: number;
};

const SuccessIndicator = ({saveState, clearTimeoutMs = 2000}: Props) => {
    const [mousePos, setMousePos] = useState<MousePos | null>(null);
    const timer = useRef(0);

    const icon = saveState.isSaving
        ? "..."
        : saveState.failed
            ? "❌" // This is a big red X
            : "✔️";

    useEffect(() => {
        const id = setInterval(() => {
            if (mousePos !== null) timer.current = 0
            else timer.current += INTERVAL_MS;

            if (timer.current > clearTimeoutMs) saveState.clear();
        }, INTERVAL_MS);
        return () => clearInterval(id);
    }, [timer, saveState, mousePos, clearTimeoutMs]);

    const classes = saveState.failed
        ? [style.successIndicator, style.helpIndicator]
        : [style.successIndicator];

    return (
        <>
        <span
            class={classes.join(" ")}
            onMouseMove={ev => {
                setMousePos({x: ev.pageX + 10, y: ev.pageY - 10});
            }}
            onMouseLeave={() => setMousePos(null)}>
            {icon}
        </span>
            {mousePos !== null && saveState.failed &&
              <div
                class={style.messageContainer}
                style={{
                    top: (mousePos as MousePos).y,
                    left: (mousePos as MousePos).x
                }}>
                  {saveState.message}
              </div>}
        </>
    );
}

export default SuccessIndicator;
