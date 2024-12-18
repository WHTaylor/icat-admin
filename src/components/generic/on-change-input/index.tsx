import {JSX} from "preact";

type Omitted = 'onChange' | 'onInput' | 'ref';
type Props = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, Omitted> & {
    onChange?: (ev: Event) => void;
    onInput?: (ev: Event) => void;
    // A function to call on the input DOM element once it's been rendered
    // This probably could be done using refs, but forwardRef is marked as
    // deprecated and I couldn't figure out a working alternative
    postRender?: (el: HTMLInputElement) => void;
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

        if (props.postRender) props.postRender(el);
    }

    return <input
        {...props}
        ref={refWithRebindOnChange}
        onChange={undefined}
        onInput={undefined}
    />;
};

export default OnChangeInput;
