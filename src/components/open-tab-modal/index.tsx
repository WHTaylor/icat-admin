import {entityNames} from '../../icat';
import {TableFilter, tableFilter} from '../../utils';

import {StateUpdater, useEffect, useRef, useState} from "preact/hooks";
import style from './style.css';
import {h} from "preact";

const MAX_MATCHES = 20;

type Props = {
    openTab: (f: TableFilter) => void;
    close: () => void;
}

type OptIdx = number | null;

const OpenTabModal = ({openTab, close}: Props) => {
    const [matches, setMatches]: [string[], StateUpdater<string[]>] = useState([]);
    const [selectedIdx, setSelectedIdx]: [OptIdx, StateUpdater<OptIdx>] =
        useState(null);

    const inputEl = useRef<HTMLInputElement>(null)

    // Close modal on Esc
    useEffect(() => {
        const readKey = ev => {
            if (ev.key === "Escape") {
                ev.preventDefault();
                close();
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [close]);

    // Use up and down arrows to select a match
    useEffect(() => {
        if (matches.length === 0) {
            setSelectedIdx(null);
            return;
        }

        const readKey = ev => {
            if (!selectionControlKeys.includes(ev.key)) {
                return;
            }

            ev.preventDefault();

            const prev = selectedIdx ?? 0;

            let newIdx;
            if (ev.key === "ArrowUp") {
                newIdx = Math.max(prev - 1, 0);
            } else if (ev.key == "ArrowDown") {
                newIdx = Math.min(prev + 1, matches.length - 1);
            } else if (ev.key === "PageUp") {
                newIdx = Math.max(prev - 5, 0);
            } else {
                newIdx = Math.min(prev + 5, matches.length - 1);
            }
            setSelectedIdx(newIdx);
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [selectedIdx, matches])

    // Focus the input element when opened
    useEffect(() => {
        if (inputEl === null) return;

        const el = inputEl.current;
        el!.focus();
    });

    // When enter is pressed, open the currently selected match in a new tab
    const handleInputKeyDown = ev => {
        if (ev.key !== "Enter") return;
        if (selectedIdx === null) return;
        openTab(tableFilter(matches[selectedIdx], 0, 50));
        close();
    }

    // Update the matching entities and selection when the input is changed
    const handleOnInput = ev => {
        const newMatches = getMatches(ev.target.value)
            .sort((a, b) => b.length - a.length)
            .reverse()
            .slice(0, MAX_MATCHES);

        if (newMatches.length === 0) {
            setSelectedIdx(null);
        } else if (selectedIdx === null) {
            setSelectedIdx(0)
        } else {
            const previousSelection = matches[selectedIdx];
            const newIdx = newMatches.findIndex(m => m === previousSelection);
            setSelectedIdx(Math.max(newIdx, 0));
        }

        setMatches(newMatches)
    };

    return <div class={style.openTabModal}>
        <h3>Open tab</h3>
        <input
            placeholder="Entity table to open..."
            onInput={handleOnInput}
            onKeyDown={handleInputKeyDown}
            ref={inputEl}/>
        <div>
            {matches &&
                <ul>
                    {
                        matches.map((m, i) =>
                            <li className={selectedIdx !== null && selectedIdx == i && style.active}>{m}</li>
                        )
                    }
                </ul>
            }
        </div>
    </div>
}

function getMatches(input: string): string[] {
    if (!input) return [];
    const pattern = ".*" + [...(input.toLowerCase())].join(".*") + ".*";
    const re = new RegExp(pattern);
    return entityNames.filter(e => re.test(e.toLowerCase()));
}

const selectionControlKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown"]

export default OpenTabModal;