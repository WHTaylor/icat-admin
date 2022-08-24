import style from './style.css';

const ContextMenu = ({items, pos}) => {
    const [x, y] = pos;
    const content = items.length > 0
        ?  <><h3>Show related</h3>
           <ul class={style.contextMenuList}>
           {items.map(i =>
               <li class={style.contextMenuRow} onClick={i[1]}>{i[0]}</li>)}
            </ul></>
        : <h3>No related entities</h3>;
    return (
        <div class={style.contextMenu} style={{"top": y, "left": x}}>
            {content}
        </div>
    );
}

export default ContextMenu;
