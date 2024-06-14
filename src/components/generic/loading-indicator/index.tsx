/*
SVG originally copied from https://github.com/n3r4zzurr0/svg-spinners under the
following license:

The MIT License (MIT)

Copyright (c) Utkarsh Verma

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import {ComponentChildren} from "preact";
import style from './style.module.css';

const LoadingIndicator = () =>
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path
            xmlns="http://www.w3.org/2000/svg"
            d="M10.14,1.16
            a11,11,0,0,0-9,8.92
            A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7
            a8,8,0,0,1,6.66-6.61
            A1.42,1.42,0,0,0,12,2.69
            h0
            A1.57,1.57,0,0,0,10.14,1.16
            Z">
            <animateTransform
                attributeName="transform"
                type="rotate"
                dur="0.7s"
                values="0 12 12;360 12 12"
                repeatCount="indefinite"/>
        </path>
    </svg>;

export const PrefixedLoadingIndicator = (props: { children: ComponentChildren }) =>
    <span class={style.withLoadingIndicatorPrefix}>
        <LoadingIndicator/>{props.children}
    </span>;

export default LoadingIndicator;
