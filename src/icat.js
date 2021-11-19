// Unpack the entries returned from the API, because they are formatted like
// { 'Investigation': { 'id': 123...}}
// Assumes all entites are the same type
function unpack(data) {
    if (data.length === 0) return [];
    const dataType = Object.keys(data[0]);
    return data.map(d => d[dataType]);
}

function queryUrlClause(args) {
    return Object.entries(args)
        .map(kv => kv.map(encodeURIComponent).join('='))
        .join('&');
}

async function formatError(errResponse) {
    const header = `${errResponse.status} ${errResponse.statusText}`;
    return errResponse.json()
        .then(r => `${header}: ${r["message"]}`);
}

class IcatClient {
    constructor(host) {
        this.serviceUrl = host + "/icat";
    }

    async login(plugin, username, password) {
        const creds = {
            "plugin": plugin,
            "credentials": [
                {"username": username},
                {"password": password}]};
        const form = new FormData();
        form.append('json', JSON.stringify(creds));
        return fetch(
            this.serviceUrl + "/session", {
                method: "POST",
                body: new URLSearchParams(form),
            })
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(j => j["sessionId"]);
    }

    async getEntries(sessionId, table, offset, limit, filter, signal) {
        const where =
            (filter === null
            || filter === undefined
            || filter.trim() === "")
            ? " "
            : ` where e.${filter.trim()}`
        const query = `select e from ${table} e` +
            `${where} limit ${offset}, ${limit}`;
        const params = {
            "sessionId": sessionId,
            "query": query,
        }
        const url = `${this.serviceUrl}/entityManager?${queryUrlClause(params)}`;
        return fetch(url, {signal})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(unpack);
    }

    async getCount(sessionId, table, filter, signal) {
        const where = (filter === null || filter.trim() === "") ? " "
            : ` where e.${filter.trim()}`
        const query = `select count(e) from ${table} e${where}`;
        const params = {
            "sessionId": sessionId,
            "query": query,
        }
        const url = `${this.serviceUrl}/entityManager?${queryUrlClause(params)}`;
        return fetch(url, {signal})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json());
    }

    async isValidSession(sessionId) {
        const url = `${this.serviceUrl}/session/${sessionId}`;
        return fetch(url)
            .then(res => res.ok);
    }

    async logout(sessionId) {
        fetch(`${this.serviceUrl}/session/${sessionId}`,
            { method: "DELETE" });
    }
}

export const entityNames = ["Application", "DataCollection", "DataCollectionDatafile", "DataCollectionDataset", "DataCollectionParameter", "Datafile", "DatafileFormat", "DatafileParameter", "Dataset", "DatasetParameter", "DatasetType", "Facility", "FacilityCycle", "Grouping", "Instrument", "InstrumentScientist", "Investigation", "InvestigationGroup", "InvestigationInstrument", "InvestigationParameter", "InvestigationType", "InvestigationUser", "Job", "Keyword", "ParameterType", "PermissibleStringValue", "PublicStep", "Publication", "RelatedDatafile", "Rule", "Sample", "SampleParameter", "SampleType", "Shift", "Study", "StudyInvestigation", "User", "UserGroup"];

export default IcatClient;
