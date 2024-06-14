import {useEffect, useRef, useState} from "preact/hooks";

import style from './style.module.css';
import LoadingIndicator from "../generic/loading-indicator";

const INTERVAL_MS = 10

type MousePos = { x: number, y: number };

type SaveState = {
    failed: boolean;
    isSaving?: boolean;
    clear: () => void;
    error: Error | null;
};

type Props = {
    saveState: SaveState;
    clearTimeoutMs?: number;
};

/**
 * An icon for representing the outcome of an async operation.
 *
 * Ellipses if still loading, a tick if successful, or a cross if failed.
 *
 * Displays an error message in a tooltip when hovering over a failed icon
 *
 * @param saveState an object representing the operation
 * @param clearTimeoutMs how long to display the success or failure icon for
 * after loading has completed
 */
const SuccessIndicator = ({saveState, clearTimeoutMs = 2000}: Props) => {
    const [mousePos, setMousePos] = useState<MousePos | null>(null);
    const timer = useRef(0);

    const icon = saveState.isSaving
        ? <LoadingIndicator/>
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
                    top: mousePos.y,
                    left: mousePos.x
                }}>
                  {saveState.error?.message}
              </div>}
        </>
    );
}

export default SuccessIndicator;
