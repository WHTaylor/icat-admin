import {ExistingIcatEntity, NewIcatEntity, TableFilter} from "./types";
import {inIcatFormat, parseDate} from "./dateUtils";

export function tableFilter(
    table: string,
    offset: number,
    limit: number,
    where?: string,
    sortField: string | null = null,
    sortAsc = true,
    includes: string[] | undefined = undefined): TableFilter {
    if (table === undefined) console.error("tableFilter called without args");
    return {
        table,
        offset,
        limit,
        where,
        sortField,
        sortAsc,
        includes
    };
}

const sortToEnd = ["createId", "createTime", "modId", "modTime"];

/**
 * Sort an array of headers into a sensible order
 *
 * This sorts 'id' to the front, the other shared entity fields to the end,
 * puts 'startDate' and 'endDate' next to each other if they both exist,
 * and otherwise makes everything alphabetical
 *
 * @param headers the entity attributes to sort
 */
export function defaultHeaderSort(headers: string[]): string[] {
    const end = headers.filter(h => sortToEnd.includes(h)).sort();
    const start = ["id"];
    const middle = headers.filter(h => h !== "id" && !sortToEnd.includes(h)).sort();
    // If the entity has start and end date fields, put the start date immediately
    // before the end date (they can be far apart when sorted alphabetically)
    if (middle.includes("startDate") && middle.includes("endDate")) {
        const startIndex = middle.findIndex(e => e === "startDate");
        const endIndex = middle.findIndex(e => e === "endDate");
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

export function queryWhereFromInput(whereInput?: string) {
    if (whereInput === null
        || whereInput === undefined
        || whereInput.trim() === "") {
        return " ";
    }

    // Split into words on spaces and any suffixes consisting of (+
    // ie. ((id > 3) and name like '%S') or name like 'M%'
    // becomes ["((", "id", ">", "3)", "or" "name", "like" "'M%'"]
    const words = whereInput.split(/\s+/)
        .map<[string, RegExpMatchArray | null]>(w =>
            [w, w.match(/([(]+)(.+)/)])
        // Take just the word if the regex didn't match, otherwise take the two
        // matched groups from the regex, the brackets and following characters
        .flatMap(p => p[1] === null ? [p[0]] : [p[1][1], p[1][2]]);

    // The first part of the filter and anything after an "and" or "or" are fields
    // being filtered on, which need to have the entity identifier prepended
    // Treat any words starting with parentheses as whitespace
    const isFieldIdentifier = (i: number) => {
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

export function difference<T>(set: Set<T>, other: Iterable<T>): Set<T> {
    const diff = new Set(set);
    for (const e of other) {
        diff.delete(e);
    }
    return diff;
}

export function withReplaced<T>(a: T[], t: T, i: number): T[] {
    return a.slice(0, i).concat(t).concat(a.slice(i + 1));
}

/**
 * Generate an array of contiguous integers, like a basic version of python's
 * range function.
 *
 * @param a Exclusive top of the range if only argument, or the bottom of the
 * range if b is also specified.
 * @param b Exclusive top of the range if specified
 */
export function range(a: number, b: number | null = null): number[] {
    const bot = b === null
        ? 0
        : a;
    const top = b === null
        ? a
        : b;
    return [...Array(top - bot).keys()].map(n => n + bot);
}

/**
 * Convert an entity into a format that can be sent to ICAT
 */
export function serialize(entity: ExistingIcatEntity | NewIcatEntity) {
    return Object.fromEntries(
        Object.entries(entity)
            .map(([k, v]) => {
                if (typeof v === "object" || typeof v === "number") {
                    return [k, v];
                }

                // Accepts date formats the don't specify milliseconds, and
                // converts to one that does because ICAT requires it.
                const asDate = parseDate(v);
                if (asDate.isValid()) {
                    return [k, inIcatFormat(asDate)];
                }

                if (v === "true") {
                    return [k, true];
                } else if (v === "false") {
                    return [k, false];
                }

                return [k, v];
            }));
}