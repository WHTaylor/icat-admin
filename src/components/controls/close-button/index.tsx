/*
The SVG icon for this button was originally sourced from
https://www.svgrepo.com/svg/526920/close-circle, from the Solar Line Duotone
Icons collections, under the CC BY license.

It has been adapted slightly to work as a preact component.
 */

import style from './style.module.css';

const CloseButton = (
    {
        onClickHandler,
        lineColour = "white",
        // Colour to fill the circle with (partially) on hover
        fillColour = "lightgrey",
        // An additional class to apply to the button, allowing it to be
        // styled by the parent component. Not convinced this is a great
        // approach, but it'll do for now
        additionalClass
    }: {
        onClickHandler: () => void,
        lineColour?: string
        fillColour?: string
        additionalClass: string
    }
) => <button
    class={style.closeButton + " " + additionalClass}
    type="button"
    onClick={ev => {
        ev.stopPropagation();
        onClickHandler();
    }}
>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        >
        <circle
            cx="12"
            cy="12"
            r="10"
            stroke={lineColour}
            stroke-width="1.5"
            fill={fillColour}
            fill-opacity="0"
        />
        <path
            d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
            stroke={lineColour}
            stroke-width="1.2"
            stroke-linecap="round"
        />
    </svg>
</button>

export default CloseButton;
