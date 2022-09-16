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

function queryIncludeClause(table) {
    const relatedEntities = oneToX[table];
    return (relatedEntities === undefined || relatedEntities.length == 0)
        ? ""
        : `include ${relatedEntities.map(a => "e." + a).join(', ')}`;
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
    const includes = queryIncludeClause(filter.table);
    return `select e from ${filter.table} e ${where} ${order} ${limit} ${includes}`;
}

class IcatClient {
    constructor(host, sessionId) {
        this.hostUrl = new URL(host);
        this.sessionId = sessionId;
    }

    sessionUrl(sessionId) {
        return new URL("icat/session/" + sessionId, this.hostUrl);
    }

    entityUrl(queryParams) {
        return new URL(
            `icat/entityManager?${queryUrlClause(queryParams)}`,
            this.hostUrl);
    }

    async login(plugin, username, password) {
        const creds = {
            plugin,
            credentials: [
                {username},
                {password}]};
        const form = new FormData();
        form.append('json', JSON.stringify(creds));
        const url = new URL("icat/session", this.hostUrl);
        return fetch(
            url, {
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
        fetch(this.sessionUrl(this.sessionId), { method: "PUT" });
    }

    async getEntries(filter, signal) {
        const query = buildQuery(filter);
        const params = {
            sessionId: this.sessionId,
            query,
        }
        return fetch(this.entityUrl(params), {signal})
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
            sessionId: this.sessionId,
            query,
        }
        return fetch(this.entityUrl(params), {signal})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json());
    }

    async getById(entityType, id) {
        const query = `${entityType} e ${queryIncludeClause(entityType)}`;
        const params = {
            sessionId: this.sessionId,
            query,
            id
        };
        return fetch(this.entityUrl(params))
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(j => j[entityType]);
    }

    async isValidSession(sessionId) {
        return fetch(this.sessionUrl(sessionId))
            .then(res => res.ok);
    }

    async logout() {
        fetch(this.sessionUrl(this.sessionId),
            { method: "DELETE" });
        this.sessionId = undefined;
    }

    async getUserName() {
        return fetch(this.sessionUrl(this.sessionId))
            .then(r => r.json());
    }

    async writeEntity(entityType, entity) {
        const form = new FormData();
        form.append('entities', JSON.stringify({[entityType]: entity}));
        form.append('sessionId', this.sessionId);
        return fetch(
            new URL("icat/entityManager", this.hostUrl), {
                method: "POST",
                body: new URLSearchParams(form),
            })
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json());
    }

    async deleteEntities(entityType, ids) {
        const entities = ids.map(id => ({[entityType]: {id}}));
        const params = {
            sessionId: this.sessionId,
            entities: JSON.stringify(entities)
        };
        return fetch(this.entityUrl(params), {method: "DELETE"})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)));
    }

    get loggedIn() {
        return this.sessionId !== undefined;
    }
}

export const entityNames = ["Affiliation", "Application", "DataCollection", "DataCollectionDatafile", "DataCollectionDataset", "DataCollectionInvestigation", "DataCollectionParameter", "DataPublication", "DataPublicationDate", "DataPublicationFunding", "DataPublicationType", "DataPublicationUser", "Datafile", "DatafileFormat", "DatafileParameter", "Dataset", "DatasetInstrument", "DatasetParameter", "DatasetTechnique", "DatasetType", "Facility", "FacilityCycle", "FundingReference", "Grouping", "Instrument", "InstrumentScientist", "Investigation", "InvestigationFacilityCycle", "InvestigationFunding", "InvestigationGroup", "InvestigationInstrument", "InvestigationParameter", "InvestigationType", "InvestigationUser", "Job", "Keyword", "ParameterType", "PermissibleStringValue", "PublicStep", "Publication", "RelatedDatafile", "RelatedItem", "Rule", "Sample", "SampleParameter", "SampleType", "Shift", "Study", "StudyInvestigation", "Technique", "User", "UserGroup"]

export const oneToX = {
    Application: ["facility"],
    DataCollectionDatafile: ["dataCollection", "datafile"],
    DataCollectionDataset: ["dataCollection", "dataset"],
    DataCollectionParameter: ["dataCollection", "type"],
    Datafile: ["datafileFormat", "dataset"],
    DatafileFormat: ["facility"],
    DatafileParameter: ["type", "datafile"],
    Dataset: ["sample", "type", "investigation"],
    DatasetParameter: ["type", "dataset"],
    DatasetType: ["facility"],
    FacilityCycle: ["facility"],
    Instrument: ["facility"],
    InstrumentScientist: ["instrument", "user"],
    Investigation: ["type", "facility"],
    InvestigationGroup: ["grouping", "investigation"],
    InvestigationInstrument: ["instrument", "investigation"],
    InvestigationParameter: ["investigation", "type"],
    InvestigationType: ["facility"],
    InvestigationUser: ["user", "investigation"],
    Job: ["inputDataCollection", "outputDataCollection", "application"],
    Keyword: ["investigation"],
    ParameterType: ["facility"],
    PermissibleStringValue: ["type"],
    Publication: ["investigation"],
    RelatedDatafile: ["sourceDatafile", "destDatafile"],
    Rule: ["grouping"],
    Sample: ["investigation", "type"],
    SampleParameter: ["sample", "type"],
    SampleType: ["facility"],
    Shift: ["investigation", "instrument"],
    Study: ["user"],
    StudyInvestigation: ["study", "investigation"],
    UserGroup: ["user", "grouping"]
};
export default IcatClient;
