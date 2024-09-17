import {EntityModification} from "./components/entity-table/row";
import {IcatEntityName} from "./icatEntityStructure";

/**
 * All the state for a single tab within an EntityBrowser
 */
export type EntityTabState = {
    key: number
    filter: TableFilter,
    data?: ExistingIcatEntity[],
    errMsg?: string,
    creations: NewIcatEntity[],
    deletions: Set<number>,
    modifications?: {[id: number]: EntityModification},
    showAllColumns: boolean
}

/**
 * The filter which defines the data that should be fetched for an entity tab
 */
export type TableFilter = {
    table: IcatEntityName;
    offset: number;
    limit: number;
    where?: string;
    sortField: string | null;
    sortAsc: boolean | null;
    includes?: string[];
}

/**
 * The types which the values of an entity being displayed in an entity-table
 * can have.
 *
 * Only scalar and X-one values are displayed in the tables, which is why array
 * values (one-many relationships) aren't included here.
 */
export type TableIcatEntityValue = string | number | ExistingIcatEntity;
/**
 * The types which the values of an ICAT entity can be
 */
export type IcatEntityValue = TableIcatEntityValue | ExistingIcatEntity[];

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

export type OpenTabHandler = (entityName: IcatEntityName, where?: string) => void;
