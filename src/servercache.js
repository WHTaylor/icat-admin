/* Functions for saving/loading local storage connection information.
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

if (typeof window === 'undefined') {
  global.localStorage = {
    _data       : {},
    setItem     : (id, val) => { return this._data[id] = String(val); },
    // Using id => this._data[id] instead of function syntax breaks the prod build
    getItem     : function(id) { this._data[id] }, //eslint-disable-line
    removeItem  : id => { return delete this._data[id]; },
    clear       : () => { this._data = {}; }
  };
}

export function saveLogin(server, username, sessionId) {
    const existing = getConnectionNumber(server, username);
    const n = existing === null ? nextFreeServerNumber() : existing;
    if (existing === null) {
        localStorage.setItem(`connection|${n}|server`, server);
        localStorage.setItem(`connection|${n}|username`, username);
    }
    localStorage.setItem(`connection|${n}|sessionId`, sessionId);
    localStorage.setItem("lastConnection", n);
}

function nextFreeServerNumber() {
    const serverNumbers = [...new Set(
        connectionEntries()
                .map(([n, _, __]) => n)
                .map(n => Number.parseInt(n)))]
        .sort();
    if (Math.min(...serverNumbers) > 1) return 1;
    for (const n of serverNumbers) {
        if (!(serverNumbers.includes(n + 1))) return n + 1
    }
}

export function invalidateLogin(serverName, username) {
    const n = getConnectionNumber(serverName, username);
    localStorage.removeItem(`connection|${n}|sessionId`);
}

function getConnectionNumber(server, username) {
    const matchingNs = connectionEntries()
        .filter(([_, k, v]) =>
            (k == "server" && v == server)
            || (k == "username" && v == username))
        .map(([n, _, __]) => n);
    // If any n appears more than once, there are entries for both server and username
    const nonUnique = matchingNs.find((n, i) => matchingNs.lastIndexOf(n) !== i);
    return nonUnique === undefined ? null : nonUnique;
}

export function getLastLogin() {
    const n = localStorage.getItem("lastConnection");
    const info = getConnection(n);
    return info === null
        ? [null, null, null]
        : [info.server, info.username, info.sessionId || null];
}

function getConnection(connectionNumber) {
    const serverKVs = connectionEntries()
        .filter(([n, _, __]) => n === connectionNumber);
    if (serverKVs.length === 0) return null;
    return serverKVs.reduce((o, [_, k, v]) => ({...o, [k]: v}), {});
}

function connectionEntries() {
    return Object.keys(localStorage)
        .filter(k => k.startsWith("connection"))
        .map(k => [...k.split("|").slice(1), localStorage[k]]);
}

export function serverNames() {
    return [...new Set(connectionEntries()
        .filter(([_, k, __]) => k == "server")
        .map(([_, __, v]) => v))];
}
