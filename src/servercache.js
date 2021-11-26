/* Information about servers is kept in local storage in key-value pairs.
 * Format: 'servers|<N>|<key>': '<value>'
 *
 * Keys include:
 *  - name -
 *  - sessionId - the last sessionId we
 *
 * There is also a 'lastServerAccessed' item which stores the number of the
 * server the user last logged onto. We retry that server on the home page.
 */

if (typeof window === 'undefined') {
  global.localStorage = {
    _data       : {},
    setItem     : function(id, val) { return this._data[id] = String(val); },
    getItem     : function(id) { return this._data.hasOwnProperty(id) ? this._data[id] : undefined; },
    removeItem  : function(id) { return delete this._data[id]; },
    clear       : function() { return this._data = {}; }
  };
}

export function saveLogin(serverName, sessionId) {
    const existing = getServerNumberByName(serverName);
    const n = existing === null ? nextFreeServerNumber() : existing;
    if (existing === null) {
        localStorage.setItem(`servers|${n}|name`, serverName);
    }
    localStorage.setItem(`servers|${n}|sessionId`, sessionId);
    localStorage.setItem("lastServerAccessed", n);
}

function nextFreeServerNumber() {
    const serverNumbers = [...new Set(
        serverEntries()
                .map(([n, k, v]) => n)
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
        .filter(([n, k, v]) => k === "name" && v === serverName)
        .map(([n, k, v]) => n);
    if (match.length === 0) return null;
    else if (match.length === 1) return match[0];
    else {
        console.error(`Several results in getServerNumberByName for ${serverName}`);
        console.log(match);
        return match[0]
    }
}

export function getLastLogin() {
    const n = localStorage.getItem("lastServerAccessed");
    const info = getServer(n);
    return info === null ? [null, null] : [info.name, info.sessionId];
}

export function getCachedSessionId() {
    const login = getLastLogin()
    if (login === null) return null;
    const [server, sessionId] = login;
    if (sessionId === undefined) return null;
    return sessionId;
}

function getServer(serverNumber) {
    const serverKVs = serverEntries()
        .filter(([n, k, v]) => n === serverNumber);
    if (serverKVs.length === 0) return null;
    return serverKVs.reduce((o, [n, k, v]) => ({...o, [k]: v}), {});
}

function serverEntries() {
    return Object.keys(localStorage)
        .filter(k => k.startsWith("servers"))
        .map(k => [...k.split("|").slice(1), localStorage[k]]);
}
