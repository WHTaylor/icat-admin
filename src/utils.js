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
