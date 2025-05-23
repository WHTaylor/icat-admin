/* Functions for saving/loading connections in/from local storage.
 *
 * The data is stored in local storage as key-value pairs.
 *
 * Format: 'connection|<N>|<key>': '<value>'
 *
 * Keys include:
 *  - server - the URL of the server
 *  - username - the username that was used
 *  - sessionId - the sessionId that was used for the connection
 *
 * There is also a 'lastConnection' item which stores the number of the last
 * active connection. We try to reuse that connection on the home page by default.
 */

type ConnectionStorageEntry = [string, string, string];
export type Connection = {
    server: string;
    sessionId: string;
    username: string;
}

if (typeof window === 'undefined') {
    global.localStorage = {
        _data: {},
        setItem(id, val) {
            this._data[id] = val;
        },
        // Using id => this._data[id] instead of function syntax breaks the prod build
        getItem (id) {
            return this._data[id]
        },
        removeItem (id) {
            return delete this._data[id];
        },
        clear() {
            this._data = {};
        },
        length: 0,
        key (n: number) { return this._data.keys[n] }
    };
}

export function saveLogin(c: Connection) {
    const existing = getConnectionNumber(c.server, c.username);
    const n = existing === null ? nextFreeConnectionNumber() : existing;
    if (existing === null) {
        localStorage.setItem(`connection|${n}|server`, c.server);
        localStorage.setItem(`connection|${n}|username`, c.username);
    }
    localStorage.setItem(`connection|${n}|sessionId`, c.sessionId);
    localStorage.setItem("lastConnection", n.toString());
}

function nextFreeConnectionNumber(): number {
    const connectionNumbers = [...new Set(
        connectionEntries()
            .map(([n, _, __]) => n)
            .map(n => Number.parseInt(n)))]
        .sort();
    if (Math.min(...connectionNumbers) > 1) return 1;
    for (const n of connectionNumbers) {
        if (!(connectionNumbers.includes(n + 1))) return n + 1
    }
    return 1;
}

export function invalidateLogin(serverName: string, username: string) {
    const n = getConnectionNumber(serverName, username);
    localStorage.removeItem(`connection|${n}|sessionId`);
}

function getConnectionNumber(server: string, username: string) {
    const matchingNs = connectionEntries()
        .filter(([_, k, v]) =>
            (k == "server" && v == server)
            || (k == "username" && v == username))
        .map(([n, _, __]) => n);
    // If any n appears more than once, there are entries for both server and username
    const nonUnique = matchingNs.find((n, i) => matchingNs.lastIndexOf(n) !== i);
    return nonUnique === undefined ? null : nonUnique;
}

export function getLastLogin(): Connection | null {
    const n = localStorage.getItem("lastConnection");
    return n === null ? null : getConnection(n);
}

function getConnection(connectionNumber: string): Connection | null {
    const connectionKVs = connectionEntries()
        .filter(([n, _, __]) => n === connectionNumber);
    if (connectionKVs.length === 0) return null;
    const asObj = connectionKVs.reduce((o, [_, k, v]) => ({...o, [k]: v}), {});
    const {server, sessionId, username} = <any>asObj;
    return {
        server, sessionId, username
    }
}

function connectionEntries(): ConnectionStorageEntry[] {
    return Object.keys(localStorage)
        .filter(k => k.startsWith("connection"))
        .map(k => [...extractConnectionKey(k), localStorage[k]]);
}

function extractConnectionKey(connectionKey: string): [string, string] {
    const [n, k] = [...connectionKey.split("|").slice(1)];
    return [n, k];
}

export function getServerNames(): string[] {
    return [...new Set(connectionEntries()
        .filter(([_, k, __]) => k == "server")
        .map(([_, __, v]) => v))];
}
