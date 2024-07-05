import style from "./style.module.css";
import {ComponentChildren, JSX} from "preact";

export const WithPrefix = (props: { children: ComponentChildren, prefix: JSX.Element }) =>
    <span class={style.withIndicatorContainer}>
        {props.prefix}{props.children}
    </span>;

export const WithSuffix = (props: { children: ComponentChildren, suffix: JSX.Element }) =>
    <span class={style.withIndicatorContainer}>
        {props.children}{props.suffix}
    </span>;
