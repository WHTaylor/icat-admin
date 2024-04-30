import dayjs from "dayjs";
import {ExistingIcatEntity, NewIcatEntity} from "./types";

// Date formats that can be used for creating/editing date fields
// Dates received from ICAT will always be in the first format
const dateFormats = [
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DD",
    "YYYY-MM-DDTHH:mm:ss[Z]",
];

export function parseDate(s: string) {
    return dayjs(s, dateFormats, true);
}

export function inIcatFormat(dt: dayjs.Dayjs) {
    return dt.format("YYYY-MM-DDTHH:mm:ss.000Z");
}

/**
 * Formats all date strings on an object into the datetime format ICAT enforces
 *
 * This allows users to change dates without specifying milliseconds, which are
 * truncated anyway, or any time at all if midnight is reasonable (ie. cycles)
 */
export function withCorrectedDateFormats(entity: ExistingIcatEntity | NewIcatEntity) {
    return Object.fromEntries(
        Object.entries(entity)
            .map(([k, v]) => {
                if (typeof v === "object" || typeof v === "number") {
                    return [k, v];
                }

                const asDate = parseDate(v);
                if (asDate.isValid()) {
                    return [k, inIcatFormat(asDate)];
                }

                return [k, v];
            }));
}