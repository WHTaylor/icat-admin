import style from "./style.module.css";
import React from "react";

const LeftColumnList = (props: {
    title: string,
    children: React.ReactNode
}) =>
    <div className={style.leftColumn}>
        <h2>{props.title}</h2>
        <ul className={style.tableList}>
            {props.children}
        </ul>
    </div>

export default LeftColumnList;