// On ICAT objects, attribute names for related entities are lowercase and pluralised.
// Remove the 's' and uppercase the first letter to get the table name.
//
// Fields called 'parameters' link to a table specific to the table
// ie. datafile.parameters are instances of DatafileParameter
export function icatAttributeToTableName(tableName, a) {
    const singular = a.slice(0, -1);
    const capitalized = singular.charAt(0).toUpperCase() + singular.slice(1);
    if (singular === "parameter") {
        return tableName + capitalized;
    } else {
        return capitalized;
    }
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
    const end = headers.filter(h => sortToEnd.includes(h)).sort();
    const start = ["id"];
    const middle = headers.filter(h => h !== "id" && !sortToEnd.includes(h)).sort();
    return start.concat(middle).concat(end);
}

export function randomSuffix() {
    const a = Math.random().toString(36).slice(2);
    const b = Math.random().toString(36).slice(2);
    return (a + b).slice(0, 8);
}
