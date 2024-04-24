﻿/*
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
        fillColour = "lightgrey" // Colour to part fill with on hover
    }: {
        onClickHandler: () => void,
        lineColour?: string
        fillColour?: string
    }
) => <button class={style.closeButton}>
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={onClickHandler}>
        <circle
            cx="12"
            cy="12"
            r="8"
            stroke={lineColour}
            stroke-width="1.2"
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