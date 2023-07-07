import {EntityModification} from "./components/entity-table/row";

/**
 * All the state for a single tab within an EntityViewer
 */
export type EntityTabState = {
    key: number
    filter: TableFilter,
    data?: ExistingIcatEntity[],
    errMsg?: string,
    creations: NewIcatEntity[],
    deletions: Set<number>,
    modifications?: {[id: number]: EntityModification}
}

/**
 * The filter which defines the data that should be fetched for an entity tab
 */
export type TableFilter = {
    table: string;
    offset: number;
    limit: number;
    where: string | null;
    sortField: string | null;
    sortAsc: boolean | null;
}

/**
 * The types which the values of an ICAT entity can be
 */
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

