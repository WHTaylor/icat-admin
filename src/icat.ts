/**
 * Functionality for interacting with ICAT servers.
 *
 * All queries to ICAT should go through the IcatClient class defined here, and
 * any data concerning ICAT (ie. the names of entities) should be kept in this
 * module.
 */
import {queryWhereFromInput} from './utils';
import {Connection} from "./connectioncache";
import {ExistingIcatEntity, NewIcatEntity, TableFilter} from "./types";
import {simplifyIcatErrMessage} from "./icatErrorHandling";
import {entityStructures} from "./icatEntityStructure";

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

async function formatError(errResponse: Response): Promise<{ message: string }> {
    return errResponse.json()
        .then(j => simplifyIcatErrMessage(j["message"]))
        .then(msg => ({
            message: `${errResponse.status}: ${msg}`
        }));
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
    const includes = filter.includes === undefined
        ? "1"
        : filter.includes.map(i => "e." + i)
            .join(", ");
    return "select e "
        + `from ${filter.table} `
        + `e ${where} ${order} ${limit} `
        + `include ${includes}`;
}

class IcatClient {
    private readonly hostUrl: URL;
    private sessionId: string | null;

    constructor(host: string, sessionId: string | null = null) {
        this.hostUrl = new URL(host);
        this.sessionId = sessionId;
    }

    sessionUrl(sessionId: string): URL {
        return buildSessionUrl(sessionId, this.hostUrl);
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

    async login(
        plugin: string,
        username: string,
        password: string): Promise<string | PromiseRejectionEvent> {
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
                : formatError(res).then(j => Promise.reject(j)))
            .then(res => res.json())
            .then(j => j["sessionId"]);
    }

    async refresh() {
        if (this.sessionId === null) return;

        fetch(this.sessionUrl(this.sessionId).toString(), {method: "PUT"});
    }

    async getEntries(filter: TableFilter, signal: AbortSignal | null = null) {
        return fetch(this.buildUrl(filter), {signal})
            .then(res => res.ok
                ? res
                : formatError(res).then(j => Promise.reject(j)))
            .then(res => res.json())
            .then(unpack);
    }

    async getCount(filter: TableFilter, signal: AbortSignal | null = null)
        : Promise<number> {
        return fetch(this.buildCountUrl(filter), {signal})
            .then(res => res.ok
                ? res
                : formatError(res).then(j => Promise.reject(j)))
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
                : formatError(res).then(j => Promise.reject(j)))
            .then(res => res.json())
            .then(j => j[entityType]);
    }

    async logout() {
        if (this.sessionId === null) return;

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
                : formatError(res).then(j => Promise.reject(j)))
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
                : formatError(res).then(j => Promise.reject(j)));
    }

    public buildUrl(filter: TableFilter): string {
        const query = buildQuery(filter);
        return this.entityUrl({query}).toString();
    }

    buildCountUrl(filter: TableFilter): string {
        const where = queryWhereFromInput(filter.where);
        const query = "select count(e) "
            + `from ${filter.table} e ${where}`;
        return this.entityUrl({query}).toString();
    }
}

export async function isValidSession(c: Connection) {
    return fetch(buildSessionUrl(c.sessionId, c.server).toString())
        .then(res => res.ok);
}

function buildSessionUrl(sessionId: string, server: string | URL) {
    return new URL("icat/session/" + sessionId, server);
}

export default IcatClient;

export function getEntityAttributes(entityType: string) {
    return entityStructures[entityType].fields;
}

export function isXToOneRelationship(
    entityType: string, field: string) {
    return entityStructures[entityType].ones
        .filter(m => m.name === field)
        .length > 0;
}

export function isOneToManyRelationship(
    entityType: string, field: string) {
    return entityStructures[entityType].manys
        .filter(m => m.name === field)
        .length > 0;
}

export function getRelatedEntityAttribute(
    entityType: string, relatedEntityField: string) {
    const match = entityStructures[entityType].manys
        .concat(entityStructures[entityType].ones)
        .filter(f => f.name === relatedEntityField);
    return match.length === 0
        ? undefined
        : match[0];
}

/**
 * Calculate the name of the id field to filter on when traversing to a related
 * entity
 *
 * Examples:
 * entityType: "Investigation", relatedEntityField: "type"
 * result = "id"
 * An investigation has exactly one type, so we filter on the type's id
 *
 * entityType: "Investigation", relatedEntityField: "datasets"
 * result = "investigation.id"
 * An investigation has many datasets, so we filter on the investigation's id
 * @param entityType the entity type the relationship starts from
 * @param relatedEntityField the field being traversed to
 */
export function idReferenceFromRelatedEntity(
    entityType: string, relatedEntityField: string) {
    if (isXToOneRelationship(entityType, relatedEntityField)) return "id";

    const relatedEntityType = getRelatedEntityAttribute(
        entityType, relatedEntityField)!.type
    const relatedEntityStructure = entityStructures[relatedEntityType].ones
        .filter(m => m.type === entityType)[0];
    return relatedEntityStructure.name + ".id";
}