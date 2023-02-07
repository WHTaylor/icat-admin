import {useState} from "preact/hooks";
import {Optional} from './genericUtils';

export function useOptionalState<T>(defaultValue?: T | null):
    [Optional<T>, ((value: Optional<T> | null) => void)] {
    const [state, setState] = useState(new Optional(defaultValue));

    const wrappedSetState = v => {
        if (v === null) setState(Optional.empty());
        else setState(v);
    };
    return [state, wrappedSetState];
}