import style from './style.css';

const ContextMenu = ({items, pos}) => {
    console.log(items);
    const content = items.length > 0
        ?  <><h3>Show related</h3>
           {items.map(i =>
               <p class={style.contextMenuRow} onClick={i[1]}>{i[0]}</p>)}</>
        : <h3>No related entities</h3>;
    return (
        <div class={style.contextMenu}>
            {content}
        </div>
    );
}

export default ContextMenu;
