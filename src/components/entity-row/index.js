const EntityRow = ({entity, headers}) => {
    return (
        <tr>
            {headers.map(k => <td>{entity[k]}</td>)}
        </tr>
    )
}

export default EntityRow;
