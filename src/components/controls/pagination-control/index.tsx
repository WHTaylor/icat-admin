import {randomSuffix} from "../../../utils";
import {useEffect} from "preact/hooks";
import style from "./style.module.css";

type Props = {
    pageNumber: number;
    handleSetPage: (n: number) => void;
    handleLimitChange: (n: number) => void;
    handlePageChange: (n: number) => void;
}

const PaginationControl = (
    {
        pageNumber,
        handleSetPage,
        handleLimitChange,
        handlePageChange
    }: Props) => {
    const decPage = () => handlePageChange(-1);
    const incPage = () => handlePageChange(1);

    const suffix = randomSuffix();
    const prevId = `previousPageBtn_${suffix}`;
    const nextId = `nextPageBtn_${suffix}`;

    const focusOkForPageChange = () =>
        document.activeElement === document.body
        || document.activeElement === document.getElementById(prevId)
        || document.activeElement === document.getElementById(nextId);

    useEffect(() => {
        const changePage = (ev: KeyboardEvent) => {
            if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
            if (!focusOkForPageChange()) return;

            ev.preventDefault();
            if (ev.key === "ArrowLeft") document.getElementById(prevId)!.click();
            else document.getElementById(nextId)!.click();
        };
        document.addEventListener("keydown", changePage);
        return () => {
            document.removeEventListener("keydown", changePage);
        }
    });

    return (
        <span class={style.paginationControl}>
            <button onClick={decPage} id={prevId}>Previous</button>
            <input type="number"
                   value={pageNumber}
                   class={style.pageInput}
                   onChange={ev => handleSetPage(
                       parseInt((ev.target as HTMLInputElement).value))}/>
            <button onClick={incPage} id={nextId}>Next</button>
            <span>
                <label for="pageSizeInput">Per page:</label>
                <select
                    name="pageSizeInput"
                    onChange={ev => handleLimitChange(Number.parseInt(
                        (ev.target as HTMLSelectElement).value))}>
                    <option value="20">20</option>
                    <option value="50" selected>50</option>
                    <option value="100">100</option>
                </select>
            </span>
        </span>
    );
}

export default PaginationControl;