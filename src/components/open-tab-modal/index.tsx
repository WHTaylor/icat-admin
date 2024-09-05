import {entityNames} from '../../icatEntityStructure';

import {useEffect, useRef, useState} from "preact/hooks";
import style from './style.module.css';
import {TargetedEvent} from "react";

const MAX_MATCHES = 20;

type Props = {
    openTab: (e: string) => void;
    close: () => void;
}

/**
 * A modal window that allows opening entity tabs by typing (a substring of) the name
 * @param openTab a function that opens a tab for entities of the given type
 * @param close a function that closes the modal
 * @constructor
 */
const OpenTabModal = ({openTab, close}: Props) => {
    const [matches, setMatches] = useState<string[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const inputEl = useRef<HTMLInputElement>(null)

    // Close modal on Esc
    useEffect(() => {
        const readKey = (ev: KeyboardEvent) => {
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

        const readKey = (ev: KeyboardEvent) => {
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
    const handleInputKeyDown = (ev: KeyboardEvent) => {
        if (ev.key !== "Enter") return;
        if (selectedIdx === null) return;
        confirmSelection(matches[selectedIdx])
    }

    const confirmSelection = (selection: string) => {
        openTab(selection);
        close();
    }

    // Update the matching entities and selection when the input is changed
    const handleOnInput = (ev: TargetedEvent<HTMLInputElement, Event>) => {
        const input = ev.target as HTMLInputElement;
        if (!input || ! input.value) return;
        const newMatches = getMatches(input.value)
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
                  {matches.map((m, i) =>
                      <li key={m}
                          onClick={() => confirmSelection(m)}
                          className={(selectedIdx ?? -1) == i && style.active}>
                          {m}
                      </li>
                  )}
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