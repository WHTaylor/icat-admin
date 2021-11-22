// On ICAT objects, attribute names for related entities are lowercase and pluralised.
// Remove the 's' and uppercase the first letter to get the table name.
export function icatAttributeToTableName(a) {
    const singular = a.slice(0, -1);
    return singular.charAt(0).toUpperCase() + singular.slice(1);
}

export function lowercaseFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1) };

export function tableFilter(table, offset, limit, where) {
    if (table === undefined) console.error("tableFilter called without args");
    return {
        key: Math.random(),
        table: table,
        offset: offset,
        limit: limit,
        where: where === undefined ? null : where,
    }
}

// By default, sort the common fields to the end
const sortToEnd = ["createId", "createTime", "modId", "modTime"];
export function defaultHeaderSort(headers) {
    const end = headers.filter(h => sortToEnd.includes(h));
    const start = ["id"];
    const middle = headers.filter(h => h !== "id" && !sortToEnd.includes(h));
    return start.concat(middle).concat(end);
}
