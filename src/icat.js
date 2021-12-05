import {queryWhereFromInput} from './utils.js';

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

function buildQuery(filter) {
    const where = queryWhereFromInput(filter.where);
    const limit =
        (filter.limit === null || filter.limit === undefined)
        ? ""
        : ` limit ${filter.offset}, ${filter.limit}`;
    const order = filter.sortField === null
        ? ""
        : `order by e.${filter.sortField} ${filter.sortAsc ? "asc" : "desc"}`;
    const relatedEntities = oneToX[filter.table];
    const includes = (relatedEntities === undefined || relatedEntities.length == 0)
        ? ""
        : `include ${relatedEntities.map(a => "e." + a).join(', ')}`;
    return `select e from ${filter.table} e ${where} ${order} ${limit} ${includes}`;
}

class IcatClient {
    constructor(host, sessionId) {
        this.serviceUrl = host + "/icat";
        this.sessionId = sessionId;
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

    async refresh() {
        fetch(this.serviceUrl + '/session/' + this.sessionId, { method: "PUT" });
    }

    async getEntries(filter, signal) {
        const query = buildQuery(filter);
        const params = {
            "sessionId": this.sessionId,
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

    async getCount(filter, signal) {
        const where = queryWhereFromInput(filter.where);
        const query = `select count(e) from ${filter.table} e ${where}`;
        const params = {
            "sessionId": this.sessionId,
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

    async logout() {
        fetch(`${this.serviceUrl}/session/${this.sessionId}`,
            { method: "DELETE" });
        this.sessionId = undefined;
    }

    async getUserName() {
        return fetch(`${this.serviceUrl}/session/${this.sessionId}`)
            .then(r => r.json());
    }

    async writeEntity(entityType, entity) {
        const form = new FormData();
        form.append('entities', JSON.stringify({[entityType]: entity}));
        form.append('sessionId', this.sessionId);
        return fetch(
            this.serviceUrl + "/entityManager", {
                method: "POST",
                body: new URLSearchParams(form),
            })
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json());
    }

    get loggedIn() {
        return this.sessionId !== undefined;
    }
}

export const entityNames = ["Application", "DataCollection", "DataCollectionDatafile", "DataCollectionDataset", "DataCollectionParameter", "Datafile", "DatafileFormat", "DatafileParameter", "Dataset", "DatasetParameter", "DatasetType", "Facility", "FacilityCycle", "Grouping", "Instrument", "InstrumentScientist", "Investigation", "InvestigationGroup", "InvestigationInstrument", "InvestigationParameter", "InvestigationType", "InvestigationUser", "Job", "Keyword", "ParameterType", "PermissibleStringValue", "PublicStep", "Publication", "RelatedDatafile", "Rule", "Sample", "SampleParameter", "SampleType", "Shift", "Study", "StudyInvestigation", "User", "UserGroup"];

export const oneToX = {
    "Application": ["facility"],
    "DataCollectionDatafile": ["dataCollection", "datafile"],
    "DataCollectionDataset": ["dataCollection", "dataset"],
    "DataCollectionParameter": ["dataCollection", "type"],
    "Datafile": ["datafileFormat", "dataset"],
    "DatafileFormat": ["facility"],
    "DatafileParameter": ["type", "datafile"],
    "Dataset": ["sample", "type", "investigation"],
    "DatasetParameter": ["type", "dataset"],
    "DatasetType": ["facility"],
    "FacilityCycle": ["facility"],
    "Instrument": ["facility"],
    "InstrumentScientist": ["instrument", "user"],
    "Investigation": ["type", "facility"],
    "InvestigationGroup": ["grouping", "investigation"],
    "InvestigationInstrument": ["instrument", "investigation"],
    "InvestigationParameter": ["investigation", "type"],
    "InvestigationType": ["facility"],
    "InvestigationUser": ["user", "investigation"],
    "Job": ["inputDataCollection", "outputDataCollection", "application"],
    "Keyword": ["investigation"],
    "ParameterType": ["facility"],
    "PermissibleStringValue": ["type"],
    "Publication": ["investigation"],
    "RelatedDatafile": ["sourceDatafile", "destDatafile"],
    "Rule": ["grouping"],
    "Sample": ["investigation", "type"],
    "SampleParameter": ["sample", "type"],
    "SampleType": ["facility"],
    "Shift": ["investigation", "instrument"],
    "Study": ["user"],
    "StudyInvestigation": ["study", "investigation"],
    "UserGroup": ["user", "grouping"]
};
export default IcatClient;
