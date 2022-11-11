/* Functions for accessing information about servers saved in local storage.
 *
 * The data is stored in local storage as key-value pairs.
 *
 * Format: 'servers|<N>|<key>': '<value>'
 *
 * Keys include:
 *  - name - the URL of the server
 *  - sessionId - the last sessionId that was used for the server
 *
 * There is also a 'lastServerAccessed' item which stores the number of the
 * server the user last logged onto. We retry that server on the home page.
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

export function saveLogin(serverName, username, sessionId) {
    const existing = getServerNumberByName(serverName);
    const n = existing === null ? nextFreeServerNumber() : existing;
    if (existing === null) {
        localStorage.setItem(`servers|${n}|name`, serverName);
    }
    localStorage.setItem(`servers|${n}|user`, username);
    localStorage.setItem(`servers|${n}|sessionId`, sessionId);
    localStorage.setItem("lastServerAccessed", n);
}

function nextFreeServerNumber() {
    const serverNumbers = [...new Set(
        serverEntries()
                .map(([n, _, __]) => n)
                .map(n => Number.parseInt(n)))]
        .sort();
    if (Math.min(...serverNumbers) > 1) return 1;
    for (const n of serverNumbers) {
        if (!(n + 1 in serverNumbers)) return n + 1
    }
}

export function invalidateLogin(serverName) {
    const n = getServerNumberByName(serverName);
    localStorage.removeItem(`servers|${n}|sessionId`);
}

export function deleteServer(name) {
    const n = getServerNumberByName(name);
    Object.keys(localStorage)
        .filter(k => k.startsWith("servers"))
        .filter(k => k.split("|")[1] === n)
        .forEach(m => localStorage.removeItem(m));
}

function getServerNumberByName(serverName) {
    const match = serverEntries()
        .filter(([_, k, v]) => k === "name" && v === serverName)
        .map(([n, _, __]) => n);

    if (match.length === 0) return null;
    else if (match.length === 1) return match[0];

    return match[0]
}

export function getLastLogin() {
    const n = localStorage.getItem("lastServerAccessed");
    const info = getServer(n);
    return info === null
        ? [null, null, null]
        : [info.name, info.user, info.sessionId || null];
}

function getServer(serverNumber) {
    const serverKVs = serverEntries()
        .filter(([n, _, __]) => n === serverNumber);
    if (serverKVs.length === 0) return null;
    return serverKVs.reduce((o, [_, k, v]) => ({...o, [k]: v}), {});
}

function serverEntries() {
    return Object.keys(localStorage)
        .filter(k => k.startsWith("servers"))
        .map(k => [...k.split("|").slice(1), localStorage[k]]);
}

export function serverNames() {
    return serverEntries()
        .filter(([_, k, __]) => k == "name")
        .map(([_, __, v]) => v);
}
