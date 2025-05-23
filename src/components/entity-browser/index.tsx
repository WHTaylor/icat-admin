import {useEffect, useState} from "preact/hooks";

import IcatClient from '../../icat';
import {entityNames, IcatEntityName} from '../../icatEntityStructure';
import {tableFilter,} from '../../utils';
import EntityTable from '../entity-table/container';
import TabWindow from '../tab-window';
import OpenTabModal from "../open-tab-modal";
import {useQueries} from "@tanstack/react-query";
import {OpenTabHandler, TableFilter} from "../../types";
import LeftColumnList from "../left-column-list";
import {useConnectionStore} from "../../state/stores";

type Props = {
    icatClient: IcatClient
    key: string;
}

/**
 * EntityBrowser is the root component for viewing entity tables. It represents
 * the main part of the window after logging in to a server.
 *
 * Contains components for opening new tables and a tab selector used to switch
 * between the opened tables.
 */
const EntityBrowser = (
    {
        icatClient,
    }: Props) => {
    const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);
    const activeTabIdx = useConnectionStore((state) => state.activeTab);
    const createEntityTab = useConnectionStore((state) => state.createEntityTab);
    const tabs = useConnectionStore((state) => state.tabs)
    const setTabData = useConnectionStore((state) => state.setTabData);
    const setTabError = useConnectionStore((state) => state.setTabError);
    const syncCreation = useConnectionStore((state) => state.syncCreation);

    const queries = tabs.map(et => ({
        queryKey: [icatClient, et.filter],
        queryFn: async ({signal}: { signal: AbortSignal }) =>
            await icatClient.getEntries(et.filter, signal),
    }));

    const results = useQueries({
        queries
    });

    results.map((res, i) => {
        const {data, error} = res;

        const tab = tabs[i]
        if (tab.data !== undefined || tab.errMsg !== undefined) return;

        if (data) {
            setTabData(data, i)
        } else if (error) {
            setTabError(error.message, i);
        }
    });

    const openTabForFilter = (f: TableFilter) => {
        createEntityTab(f);
        // Timeout is used as a small hack to make sure scroll happens after component
        // rerenders (or at least, that's what it appears to do).
        setTimeout(() => window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        }), 1);
    };

    const openTab: OpenTabHandler = (entityName: IcatEntityName, where?: string) =>
        openTabForFilter(tableFilter(entityName, 0, 50, where));

    const insertCreation = async (i: number, id: number) => {
        if (activeTabIdx === undefined) return;

        const activeTab = tabs[activeTabIdx];
        const entity = await icatClient.getById(activeTab.filter.table, id);
        syncCreation(i, entity)
    }

    useEffect(() => {
        // Could base this on the icat/properties.lifetimeMinutes, but this is simpler
        const twentyMinutes = 1000 * 60 * 20;
        const id = setInterval(() => icatClient.refresh(), twentyMinutes);
        return () => clearInterval(id);
    }, [icatClient]);

    // Bind Alt-Shift-O to toggle an OpenTabModal
    useEffect(() => {
        const readKey = (ev: KeyboardEvent) => {
            if (ev.altKey && ev.shiftKey && ev.key == "O") {
                setIsOpenTabModalOpen(!isOpenTabModalOpen)
            }
        }
        document.addEventListener("keydown", readKey);
        return () => document.removeEventListener("keydown", readKey);
    }, [isOpenTabModalOpen])

    return (
        <>
            <LeftColumnList title={"ICAT Tables"}>
                {
                    entityNames.map(en =>
                        <li key={en}>
                            <button onClick={() => openTab(en)}>
                                {en}
                            </button>
                        </li>)
                }
            </LeftColumnList>

            {tabs.length > 0 &&
              <div className="mainContentAndRightColumn">
                  <TabWindow/>
                  {activeTabIdx !== undefined &&
                    <EntityTable
                      icatClient={icatClient}
                      openTab={openTab}
                      insertCreation={insertCreation}
                    />
                  }
              </div>
            }

            {isOpenTabModalOpen &&
              <OpenTabModal
                openTab={openTab}
                close={() => setIsOpenTabModalOpen(false)}
              />
            }
        </>
    );
}

export default EntityBrowser;
