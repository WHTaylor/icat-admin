/* Functions for handling query parameters used for routing */

export function urlSearchParamsToObj(params) {
    if (params == null) return null;
    const res = {}
    for (const [k, v] of params.entries()) res[k] = v;
    return res;
}

export function parseUrlParams(params) {
    if (params == null || params.server == undefined)  return [null, null];
    const connection = {server: params.server, username: params.username};
    const filter = params.table == null
        ? null
        : {
            table: params.table,
            where: params.where,
            offset: params.offset,
            limit: params.limit,
            sortField: params.sortField,
            sortAsc: params.sortAsc,
        };

    return [connection, filter];
}

function toURLParams(connection, filter) {
    const usp = new URLSearchParams();
    if (connection != null) {
        Object.entries(connection)
            .filter(([k, v]) => k != "sessionId" && v != null)
            .forEach(([k, v]) => usp.append(k, v));
    }
    if (filter != null) {
        Object.entries(filter)
            .filter(([k, v]) => v != null)
            .forEach(([k, v]) => usp.append(k, v));
    }
    return usp;
}

// URLSearchParams.toString doesn't seem to URL encode in an expected way
export function encodedSearchParams(params) {
    return Array.from(
            params.entries(),
            ([k, v]) => encodeURI(k) + "=" + encodeURI(v))
        .join("&");
}

export function buildUrl(connection, filter) {
    return `/icat?${encodedSearchParams(toURLParams(connection, filter))}`;
}

export function mergeFilterIntoParams(params, filter) {
    if (params == null) return "";

    if (filter === null) {
        params.delete("table");
        params.delete("where");
        params.delete("offset");
        params.delete("limit");
        params.delete("sortField");
        params.delete("sortAsc");
    } else {
        for (const k of ["table", "where", "offset", "limit", "sortField", "sortAsc"]) {
            if (filter[k] != null) {
                params.set(k, filter[k]);
            } else {
                params.delete(k);
            }
        }
    }

    return encodedSearchParams(params);
}
