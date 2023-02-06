import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import {entityNames} from './icat';

dayjs.extend(customParseFormat);

export type TableFilter = {
    key: number;
    table: string;
    offset: number;
    limit: number;
    where: string | null;
    sortField: string | null;
    sortAsc: boolean | null;
}

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
    }

    return capitalizedSingular;
}

export function joinAttributeToTableName(originTable: string, attribute: string): string | null {
    if (attribute === "type") {
        // instrument.type is just a free text description field
        if (originTable == "Instrument") return null
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
    }

    return null;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function lowercaseFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

export function tableFilter(
    table: string,
    offset: number,
    limit: number,
    where: string | null = null,
    sortField: string | null = null,
    sortAsc = true): TableFilter {
    if (table === undefined) console.error("tableFilter called without args");
    return {
        key: Math.random(),
        table,
        offset,
        limit,
        where: where === undefined ? null : where,
        sortField,
        sortAsc,
    };
}

export function assignKey(filter) {
    return {key: Math.random(), ...filter};
}

// By default, sort id to the beginning and the other common fields to the end
const sortToEnd = ["createId", "createTime", "modId", "modTime"];
export function defaultHeaderSort(headers) {
    const end = headers.filter(h => sortToEnd.includes(h)).sort();
    const start = ["id"];
    const middle = headers.filter(h => h !== "id" && !sortToEnd.includes(h)).sort();
    // If the entity has start and end date fields, put the start date immediately
    // before the end date (they can be far apart when sorted alphabetically)
    if (middle.includes("startDate") && middle.includes("endDate")) {
        let startIndex = middle.findIndex(e => e === "startDate");
        let endIndex = middle.findIndex(e => e === "endDate");
        middle.splice(startIndex, 1);
        middle.splice(endIndex, 0, "startDate");
    }
    return start.concat(middle).concat(end);
}
export const commonFields = ["id", ...sortToEnd];

export function randomSuffix() {
    const a = Math.random().toString(36).slice(2);
    const b = Math.random().toString(36).slice(2);
    return (a + b).slice(0, 8);
}

export function queryWhereFromInput(whereInput) {
    if (whereInput === null || whereInput === undefined || whereInput.trim() === "")
        return " ";

    // Split into words on spaces and any suffixes consisting or (+
    // ie. ((id > 3) and name like '%S') or name like 'M%'
    // -> ["((", "id", ">", "3)", "and" "name", ...
    const words = whereInput.split(/\s+/)
        .map(w => [w, w.match(/([(]+)(.+)/)])
        .flatMap(p => p[1] === null ? [p[0]] : [p[1][1], p[1][2]]);

    // The first part of the filter and anything after an "and" or "or" are fields
    // being filtered on, which need to have the entity identifier prepended
    // Treat any words starting with parentheses as whitespace
    const isFieldIdentifier = i => {
        if (words[i].startsWith("(")) return false;
        const wordsBefore = words.slice(0, i)
            .filter(w => !(w.startsWith("(") || w.startsWith(")")))
        if (wordsBefore.length === 0) return true;
        const wordBefore = wordsBefore.slice(-1)[0].toUpperCase();
        return wordBefore === "AND" || wordBefore === "OR";
    };
    const withEntityIdentifier = words.map((w, i) => isFieldIdentifier(i) ? `e.${w}` : w)
        .join(" ");
    return ` where ${withEntityIdentifier}`;
}

export function difference<T>(set: Set<T>, other: Set<T>): Set<T> {
    let diff = new Set(set);
    for (let e of other) {
        diff.delete(e);
    }
    return diff;
}

const dateFormats = [
 "YYYY-MM-DDTHH:mm:ss.SSSZ",
 "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
 "YYYY-MM-DDTHH:mm:ssZ",
 "YYYY-MM-DDTHH:mm:ss[Z]",
];
export function parseISODate(s) {
    return dayjs(s, dateFormats, true);
}

/* Convert date formats to the single format that ICAT allows.
 *
 * This allows users to change dates without specifying milliseconds, which are
 * truncated anyway
 * */
export function withCorrectedDateFormats(entity) {
    return Object.fromEntries(
        Object.entries(entity)
            .map(([k, v]) => {
                const asDate = parseISODate(v);
                if (asDate.isValid()) {
                    const formatted = asDate.format("YYYY-MM-DDTHH:mm:ss.000Z");
                    return [k, formatted];
                } else {
                    return [k, v];
                }
            }));
}
