import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

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