import {useState} from "preact/hooks";
import {Optional} from './genericUtils';

export function useOptionalState<T>(defaultValue?: T | null):
    [Optional<T>, ((value: Optional<T> | T | null) => void)] {
    const [state, setState] = useState(new Optional(defaultValue));

    const wrappedSetState = v => {
        const wrappedValue: Optional<T> = v === null
            ? Optional.empty()
            : typeof v === "object" && v.constructor.name === "Optional"
                ? v
                : new Optional(v);
        setState(wrappedValue);
    };
    return [state, wrappedSetState];
}