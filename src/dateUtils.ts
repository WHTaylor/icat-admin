import dayjs from "dayjs";
import {ExistingIcatEntity, NewIcatEntity} from "./icat";

const dateFormats = [
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-MM-DDTHH:mm:ss[Z]",
];

export function parseISODate(s) {
    return dayjs(s, dateFormats, true);
}

/**
 * Convert date formats to the single format that ICAT allows.
 *
 * This allows users to change dates without specifying milliseconds, which are
 * truncated anyway
 */
export function withCorrectedDateFormats(entity: ExistingIcatEntity | NewIcatEntity) {
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