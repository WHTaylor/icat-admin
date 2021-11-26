import {entityNames} from './icat.js';

// On ICAT objects, attribute names for related entities are lowercase and pluralised.
// Remove the 's' and uppercase the first letter to get the table name.
//
// Fields called 'parameters' link to a table specific to the table
// ie. datafile.parameters are instances of DatafileParameter
export function icatAttributeToTableName(tableName, a) {
    const singular = a.slice(0, -1);
    const capitalizedSingular = capitalize(singular);
    if (singular === "parameter") {
        return tableName + capitalizedSingular;
    } else {
        return capitalizedSingular;
    }
}

export function joinAttributeToTableName(originTable, attribute) {
    if (attribute === "type") {
        if (originTable.endsWith("Parameter")) return "ParameterType";
        return originTable + "Type";
    } else if (attribute === "facility") {
        return "Facility";
    } else if (attribute.endsWith("Datafile")) {
        return "Datafile";
    } else if (attribute.endsWith("DataCollection")) {
        return "DataCollection";
    } else if (entityNames.includes(capitalize(attribute))) {
        return capitalize(attribute);
    } else {
        console.warn(`Unknown attribute in joinAttributeToTableName '${attribute}'`);
    }
}

export function lowercaseFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1) };

export function tableFilter(table, offset, limit, where, sortField=null, sortAsc=true) {
    if (table === undefined) console.error("tableFilter called without args");
    return {
        key: Math.random(),
        table: table,
        offset: offset,
        limit: limit,
        where: where === undefined ? null : where,
        sortField: sortField,
        sortAsc: sortAsc,
    };
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

const datePattern = /\d{4}-\d{2}-\d{2}T.+/
export function isDatetime(s) { return s.search(datePattern) > -1 }

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1);}
