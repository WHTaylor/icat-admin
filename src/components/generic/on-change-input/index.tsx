import {JSX} from "preact";

type Omitted = 'onChange' | 'onInput';
type Props = Omit<JSX.HTMLAttributes<HTMLInputElement>, Omitted> & {
    onChange?: (ev: Event) => void;
    onInput?: (ev: Event) => void;
}

/**
 * An input that binds `onChange` to the DOM onchange attribute.
 *
 * Because this project uses react-query, preact/compat is also in use. This
 * causes JSX onChange to bind the oninput attribute instead, to match React's
 * functionality, but we want to make use of onchange in some cases.
 */
const OnChangeInput = (props: Props) => {
    const refWithRebindOnChange = (el: HTMLInputElement | null) => {
        if (!el) return;

        el.onchange = props.onChange ?? null;
        el.oninput = props.onInput ?? null;

        if (props.ref === undefined || props.ref === null) return;

        if (typeof props.ref === "function") props.ref(el);
        else props.ref.current = el;
    }

    return <input
        ref={refWithRebindOnChange}
        {...props}
        onChange={undefined}
        onInput={undefined}
    />;
};

export default OnChangeInput;
