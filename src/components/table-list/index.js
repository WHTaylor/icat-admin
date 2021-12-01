import {useState, useEffect, useRef} from "preact/hooks";

import style from './style.css';
import {entityNames} from '../../icat.js';
import {tableFilter} from '../../utils.js';

const TableList = ({openTab}) => {
    return (
        <>
        <h2>ICAT tables</h2>
        <ul>
            {entityNames.map(en =>
                <li>
                    <button
                        class="entityButton"
                        onClick={() => openTab(tableFilter(en, 0, 50))}>
                        {en}
                    </button>
                </li>)}
        </ul>
        </>
    );
}

export default TableList
