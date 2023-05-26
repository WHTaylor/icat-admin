/**
 * Functionality for interacting with ICAT servers.
 *
 * All queries to ICAT should go through the IcatClient class defined here, and
 * any data concerning ICAT (ie. the names of entities) should be kept in this
 * module.
 */
import {queryWhereFromInput, TableFilter} from './utils';

export type IcatEntityValue = string | number | ExistingIcatEntity | ExistingIcatEntity[];

export type IcatEntity = {
    [k: string]: IcatEntityValue;
}

/**
 * An entity which already exists, and so has an ID assigned to it
 */
export type ExistingIcatEntity = IcatEntity & {
    id: number;
}

/**
 * An entity which hasn't been created in ICAT yet, so doesn't have an ID
 */
export type NewIcatEntity = IcatEntity & {
    id?: never
};

type IcatResponse = { [k: string]: ExistingIcatEntity }[]

// Unpack the entries returned from the API, because they are formatted like
// { 'Investigation': { 'id': 123...}}
// Assumes all entites are the same type
function unpack(data: IcatResponse): ExistingIcatEntity[] {
    if (data.length === 0) return [];
    const first = data[0];
    const dataType = Object.keys(first)[0];
    return data.map(d => d[dataType]);
}

function queryUrlClause(args: { [k: string]: string | number }) {
    return Object.entries(args)
        .map(kv => kv.map(encodeURIComponent).join('='))
        .join('&');
}

async function formatError(errResponse: Response): Promise<string> {
    const header = `${errResponse.status} ${errResponse.statusText}`;
    return errResponse.json()
        .then(r => `${header}: ${r["message"]}`);
}

function buildQuery(filter: TableFilter) {
    const where = queryWhereFromInput(filter.where);
    const limit =
        filter.limit == null
            ? ""
            : ` limit ${filter.offset}, ${filter.limit}`;
    const order = filter.sortField == null
        ? ""
        : `order by e.${filter.sortField} ${filter.sortAsc ? "asc" : "desc"}`;
    return `select e from ${filter.table} e ${where} ${order} ${limit} include 1`;
}

class IcatClient {
    private readonly hostUrl: URL;
    private sessionId: string | null;

    constructor(host: string, sessionId: string | null = null) {
        this.hostUrl = new URL(host);
        this.sessionId = sessionId;
    }

    sessionUrl(sessionId) {
        return new URL("icat/session/" + sessionId, this.hostUrl);
    }

    entityUrl(queryParams: { [k: string]: string | number }): URL {
        if (this.sessionId === null) {
            throw Error("Can't create entity URL before session ID is set");
        }
        const params = {...queryParams, sessionId: this.sessionId!};
        return new URL(
            `icat/entityManager?${queryUrlClause(params)}`,
            this.hostUrl);
    }

    async login(plugin, username, password): Promise<string | PromiseRejectionEvent> {
        const creds = {
            plugin,
            credentials: [
                {username},
                {password}]
        };
        const form = new FormData();
        form.append('json', JSON.stringify(creds));
        const url = new URL("icat/session", this.hostUrl).toString();
        return fetch(
            url, {
                method: "POST",
                body: new URLSearchParams(form as any),
            })
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(j => j["sessionId"]);
    }

    async refresh() {
        fetch(this.sessionUrl(this.sessionId).toString(), {method: "PUT"});
    }

    async getEntries(filter, signal): Promise<ExistingIcatEntity[]> {
        const query = buildQuery(filter);
        const params = {
            query,
        }
        return fetch(this.entityUrl(params).toString(), {signal})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(unpack);
    }

    async getCount(filter, signal): Promise<number> {
        const where = queryWhereFromInput(filter.where);
        const query = `select count(e) from ${filter.table} e ${where}`;
        const params = {
            query,
        }
        return fetch(this.entityUrl(params).toString(), {signal})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(json => json[0] as number);
    }

    async getById(entityType: string, id: number): Promise<ExistingIcatEntity> {
        const query = `${entityType} e include 1`;
        const params = {
            query,
            id
        };
        return fetch(this.entityUrl(params).toString())
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json())
            .then(j => j[entityType]);
    }

    async isValidSession(sessionId) {
        return fetch(this.sessionUrl(sessionId).toString())
            .then(res => res.ok);
    }

    async logout() {
        await fetch(this.sessionUrl(this.sessionId).toString(),
            {method: "DELETE"});
        this.sessionId = null;
    }

    async writeEntity(
        entityType: string, entity: ExistingIcatEntity | NewIcatEntity)
    : Promise<number[]> {
        const form = new FormData();
        form.append('entities', JSON.stringify({[entityType]: entity}));
        form.append('sessionId', this.sessionId || "");
        return fetch(
            new URL("icat/entityManager", this.hostUrl).toString(),
            {
                method: "POST",
                body: new URLSearchParams(form as any),
            })
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)))
            .then(res => res.json());
    }

    async deleteEntities(entityType: string, ids: number[]): Promise<Response> {
        const entities = ids.map(id => ({[entityType]: {id}}));
        const params = {
            entities: JSON.stringify(entities)
        };
        return fetch(this.entityUrl(params).toString(), {method: "DELETE"})
            .then(res => res.ok
                ? res
                : formatError(res)
                    .then(msg => Promise.reject(msg)));
    }
}

export const entityNames = ["Affiliation", "Application", "DataCollection", "DataCollectionDatafile", "DataCollectionDataset", "DataCollectionInvestigation", "DataCollectionParameter", "DataPublication", "DataPublicationDate", "DataPublicationFunding", "DataPublicationType", "DataPublicationUser", "Datafile", "DatafileFormat", "DatafileParameter", "Dataset", "DatasetInstrument", "DatasetParameter", "DatasetTechnique", "DatasetType", "Facility", "FacilityCycle", "FundingReference", "Grouping", "Instrument", "InstrumentScientist", "Investigation", "InvestigationFacilityCycle", "InvestigationFunding", "InvestigationGroup", "InvestigationInstrument", "InvestigationParameter", "InvestigationType", "InvestigationUser", "Job", "Keyword", "ParameterType", "PermissibleStringValue", "PublicStep", "Publication", "RelatedDatafile", "RelatedItem", "Rule", "Sample", "SampleParameter", "SampleType", "Shift", "Study", "StudyInvestigation", "Technique", "User", "UserGroup"]

export default IcatClient;
