import style from "./style.module.css";
import {JSX} from "preact";

const LeftColumnList = (props: {
    title: string,
    makeChildren: (className: string) => JSX.Element[]
}) =>
    <div className={style.leftColumn}>
        <h2>{props.title}</h2>
        <ul className={style.tableList}>
            {props.makeChildren(style.entityButton)}
        </ul>
    </div>

export default LeftColumnList;