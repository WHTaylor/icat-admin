import {JSX, Ref} from "preact";
import {forwardRef} from "react";

type Omitted = 'onChange' | 'onInput' | 'ref';
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
const OnChangeInput = forwardRef((props: Props, ref: Ref<HTMLInputElement>) => {
    const refWithRebindOnChange = (el: HTMLInputElement | null) => {
        if (!el) return;

        el.onchange = props.onChange ?? null;
        el.oninput = props.onInput ?? null;

        if (ref === undefined || ref === null) return;

        if (typeof ref === "function") ref(el);
        else ref.current = el;
    }

    return <input
        ref={refWithRebindOnChange}
        {...props}
        onChange={undefined}
        onInput={undefined}
    />;
});

export default OnChangeInput;
