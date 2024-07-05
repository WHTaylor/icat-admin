import style from './style.module.css';
import {
    useMutation,
    useQueries,
    useQuery,
    UseQueryResult
} from "@tanstack/react-query";
import {range, tableFilter} from "../../../../utils";
import {ExistingIcatEntity} from "../../../../types";
import {Dispatch, useState} from "preact/hooks";
import {ConnectionStateAction} from "../../../../state/connection";
import {MoveRunsState, RunRange} from "../../../../state/tools";
import OnChangeInput from "../../../generic/on-change-input";
import CloseButton from "../../../controls/close-button";
import LoadingIndicator from "../../../generic/loading-indicator";
import {JSX} from "preact";
import IcatClient from "../../../../icat";
import {WithSuffix} from "../../../generic/with-indicator";

type Props = {
    icatClient: IcatClient
    dispatch: Dispatch<ConnectionStateAction>
    state: MoveRunsState
}

type IcatInstrument = ExistingIcatEntity & {
    name: string
}

const MoveRunsTool = (
    {
        icatClient,
        dispatch,
        state
    }: Props
) => {
    const [singleRunInputValue, setSingleRunInputValue] = useState<string>("");
    const [startRangeInputValue, setStartRangeInputValue] = useState<string>("");
    const [endRangeInputValue, setEndRangeInputValue] = useState<string>("");

    const singleRunInputIsValid = singleRunInputValue.trim().length > 0
        && Number.isInteger(Number(singleRunInputValue.trim()));
    const runRangeInputsAreValid = startRangeInputValue.trim().length > 0
        && endRangeInputValue.trim().length > 0
        && Number.isInteger(Number(startRangeInputValue.trim()))
        && Number.isInteger(Number(endRangeInputValue.trim()))
        && Number(startRangeInputValue.trim()) < Number(endRangeInputValue.trim());

    const runNumbers = state.runRanges.flatMap(rr => range(rr.start, rr.end + 1));
    // Make a query for each run in the selected run ranges.
    // Individual queries are much faster than doing several runs at once joined
    // with ORs.
    const dfQueries = state.instrument === undefined
        ? []
        : runNumbers.map(r => {
            const where = "name like '" + state.instrument + "%" + r + "%'";
            const f = tableFilter("Datafile", 0, 0, where);
            return {
                queryKey: [icatClient.buildUrl(f)],
                // TODO: filter with regex to name = <instr>0*<run>\D+
                queryFn: async ({signal}: { signal: AbortSignal }) =>
                    await icatClient.getEntries(f, signal)
            }
        })

    const dfQueryResults = useQueries({queries: dfQueries});
    const dfQueryResultsByRunNumbers = Object.fromEntries(
        dfQueryResults.map((r, i) => [runNumbers[i], r]));
    const handleAddSingleClick = () => {
        const val = singleRunInputValue.trim();
        if (val.length === 0) return;
        dispatch({
            type: "move_runs_add_range",
            runStart: Number(val),
            runEnd: Number(val)
        })
    }

    const handleAddSingleKey = (ev: KeyboardEvent) => {
        if (ev.key === "Enter") handleAddSingleClick();
    }

    const handleAddRangeClick = () => {
        const start = startRangeInputValue.trim();
        const end = endRangeInputValue.trim();
        if (start.length === 0 || end.length === 0) return;
        dispatch({
            type: "move_runs_add_range",
            runStart: Number(start),
            runEnd: Number(end)
        })
    }

    const handleAddRangeKey = (ev: KeyboardEvent) => {
        if (ev.key === "Enter") handleAddRangeClick();
    }

    const cantExecuteReasons = [];
    if (state?.investigation?.datasets === undefined) {
        cantExecuteReasons.push("No investigation loaded");
    } else if ((state.investigation.datasets as ExistingIcatEntity[]).length === 0) {
        cantExecuteReasons.push("Investigation has no dataset");
    }

    if (dfQueryResults.length > 0
        && dfQueryResults.filter(q => !q.isSuccess).length > 0) {
        cantExecuteReasons.push("Still loading datafiles");
    } else if (dfQueryResults.flatMap(q =>
        q.data === undefined ? [] : q.data).length === 0) {
        cantExecuteReasons.push("No datafiles selected");
    }

    return <>
        <p class={style.description}>
            Associate sets of datafiles with a different investigation
        </p>
        <div>
            <h3>Select Instrument</h3>
            <InstrumentSelector
                icatClient={icatClient}
                instrument={state.instrument}
                setInstrument={i => dispatch(
                    {type: "move_runs_set_instrument", instrument: i})}/>
        </div>
        <div>
            <h3>Select run(s)</h3>
            <div class={style.runSelectContainer}>
                <div>
                    <button
                        type="button"
                        onClick={handleAddSingleClick}
                        disabled={!singleRunInputIsValid}
                    >
                        Add single run
                    </button>
                    <input
                        type="number"
                        placeholder="Enter run number"
                        value={singleRunInputValue}
                        min="1"
                        onKeyPress={handleAddSingleKey}
                        onChange={ev => setSingleRunInputValue(
                            (ev.target as HTMLInputElement).value)}
                    />
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleAddRangeClick}
                        disabled={!runRangeInputsAreValid}
                    >
                        Add range of runs
                    </button>
                    <input
                        type="number"
                        placeholder="First run number"
                        value={startRangeInputValue}
                        min="1"
                        onKeyPress={handleAddRangeKey}
                        onChange={ev => setStartRangeInputValue(
                            (ev.target as HTMLInputElement).value)}
                    />
                    <input
                        type="number"
                        placeholder="Last run number"
                        value={endRangeInputValue}
                        min="1"
                        onKeyPress={handleAddRangeKey}
                        onChange={ev => setEndRangeInputValue(
                            (ev.target as HTMLInputElement).value)}
                    />
                </div>

                {state.runRanges.length > 0 &&
                  <SelectedRuns
                    runRanges={state.runRanges}
                    dispatch={dispatch}
                    dfQueryResultsByRunNumbers={dfQueryResultsByRunNumbers}
                  />}
            </div>
        </div>
        <div>
            <h3>Select investigation</h3>
            <InvestigationSelector
                icatClient={icatClient}
                investigation={state.investigation}
                setInvestigation={i => dispatch(
                    {type: "move_runs_set_investigation", investigation: i})}
            />
        </div>
        {cantExecuteReasons.length === 0
            ? <MoveExecutor
                dataset={(state?.investigation?.datasets as ExistingIcatEntity[])[0]}
                datafiles={dfQueryResults.map(q => q.data)
                    .flatMap(dfs => dfs === undefined ? [] : dfs)}
                icatClient={icatClient}
            />
            : <div>
                {cantExecuteReasons.map(r => <p key={r}>{r}</p>)}
            </div>
        }
    </>
}

const SelectedRuns = (
    {
        runRanges,
        dispatch,
        dfQueryResultsByRunNumbers
    }: {
        runRanges: RunRange[],
        dispatch: Dispatch<ConnectionStateAction>
        dfQueryResultsByRunNumbers: {
            [_: number]: UseQueryResult<ExistingIcatEntity[], Error>
        }
    }) => {
    const close = (a: number, b?: number) => dispatch({
        type: "move_runs_remove_range",
        runStart: a,
        runEnd: b === undefined ? a : b
    });

    const getContentForRange = (runRange: RunRange) => {
        const results = range(runRange.start, runRange.end + 1)
            .map(n => dfQueryResultsByRunNumbers[n])
            .filter(r => r !== undefined);
        if (results.length === 0) return undefined;
        const dfsFound = results.filter(r => r.isSuccess)
            .map(r => r.data?.length ?? 0)
            .reduce((a, b) => a + b, 0)
        const countPending = results.filter(r => r.isPending)
            .length;
        return {
            dfsFound,
            countPending
        }
    }

    const makeCard = (rr: RunRange) => {
        const header = rr.start === rr.end
            ? rr.start.toString()
            : rr.start + " - " + rr.end;
        const content = getContentForRange(rr);
        const rows: (string | JSX.Element)[] = [header];
        // If no instrument has been defined, there won't be any query results
        if (content !== undefined) {
            rows.push(content.dfsFound + " datafiles");
            if (content.countPending > 0) {
                const total = (rr.end - rr.start + 1);
                const s = "Searched " + (total - content.countPending) + "/" + total;
                rows.push(
                    <WithSuffix suffix={<LoadingIndicator/>}>{s}</WithSuffix>);
            }
        }
        return <Card
            close={() => close(rr.start, rr.end)}
            rows={rows}/>
    }

    const sorted = [...runRanges];
    sorted.sort((a, b) => a.start - b.start);
    return <div class={style.selectedRunsContainer}>
        {sorted.map(makeCard)}
    </div>
};

const InstrumentSelector = (
    {
        icatClient,
        instrument,
        setInstrument
    }: {
        icatClient: IcatClient,
        instrument: string | undefined,
        setInstrument: (i: string) => void
    }) => {
    const instrumentResult = useQuery(
        {
            queryKey: ["instruments"],
            queryFn: ({signal}) =>
                icatClient.getEntries(tableFilter("Instrument", 0, 0), signal)
        }
    );

    let instrumentOptions;
    if (instrumentResult.isSuccess) {
        const instruments = instrumentResult.data as IcatInstrument[];
        instruments.sort((i1, i2) => i1.name.localeCompare(i2.name));
        instrumentOptions = instruments.map(i =>
            <option selected={i.name === instrument} key={i}>{i.name}</option>
        );
    } else {
        instrumentOptions = [<option key="loading">Loading...</option>];
    }

    return <select
        onChange={ev => setInstrument((ev.target as HTMLSelectElement).value)}
        disabled={!instrumentResult.isSuccess}>
        {instrumentOptions}
    </select>
};

const InvestigationSelector = (
    {
        icatClient,
        investigation,
        setInvestigation
    }: {
        icatClient: IcatClient,
        investigation?: ExistingIcatEntity
        setInvestigation: (i?: ExistingIcatEntity) => void
    }) => {
    const [investigationName, setInvestigationName] = useState<string>("");
    const isValidInvestigationName = investigationName.trim().length > 0;
    const f = tableFilter(
        "Investigation",
        0,
        0,
        "name = '" + investigationName + "'",
        null,
        true,
        ["datasets"]);
    const queryFn = isValidInvestigationName
        ? ({signal}: { signal: AbortSignal }) =>
            icatClient.getEntries(f, signal)
        : () => [];
    const query = {
        queryKey: [icatClient.buildUrl(f)],
        queryFn
    };
    const {isPending, isSuccess, data} = useQuery(query);
    const queryDone = isSuccess && isValidInvestigationName && data !== undefined;

    // If there was only one match, select it automatically
    if (queryDone
        && data.length === 1
        && investigation === undefined) {
        setInvestigation(data[0]);
        setInvestigationName("");
        return <></>;
    }

    return <div>
        <div class={style.selectedInvestigation}>
            {investigation !== undefined
                ? <Card close={() => setInvestigation(undefined)}
                        rows={[
                            investigation.id.toString(),
                            "RB" + investigation.name,
                            "Visit: " + investigation.visitId]}/>
                : <WithSuffix suffix={
                    isPending
                        ? <LoadingIndicator/>
                        : <>{queryDone && data.length === 0
                            && "No matching investigation found"}</>}>
                    <OnChangeInput
                        onChange={ev => setInvestigationName(
                            (ev.target as HTMLInputElement).value)}
                        placeholder="Enter investigation name"/>
                </WithSuffix>
            }
        </div>

        <hr/>

        {queryDone && data.length > 1 && <div>
            {data.map(i => <div key={i}>
                <button type="button" onClick={_ => {
                    setInvestigationName("");
                    setInvestigation(i)
                }
                }>
                    Select
                </button>
                Visit id: {i.visitId}
            </div>)}
        </div>}
    </div>
};

const Card = (
    {
        close,
        rows
    }: {
        close: () => void,
        rows: (string | JSX.Element)[]
    }) => {
    const closeOnMiddleClick = (ev: MouseEvent) => {
        if (ev.buttons == 4) {
            ev.stopPropagation();
            close()
        }
    };
    return <div
        onMouseDown={closeOnMiddleClick}
        class={style.moveRunsCard}>
        <div class={style.moveRunsCardContent}>
            {rows.map((r, i) => <div key={i}>{r}</div>)}
        </div>
        <CloseButton
            onClickHandler={close}
            additionalClass={style.closeButton}
            lineColour="black"
            fillColour="white"
        />
    </div>
}

const MoveExecutor = (
    {
        datafiles,
        dataset,
        icatClient
    }: {
        datafiles: ExistingIcatEntity[]
        dataset: ExistingIcatEntity
        icatClient: IcatClient
    }
) => {
    const [successCount, setSuccessCount] = useState(0);

    const moveDfMutation = useMutation({
        mutationFn: (datafile: ExistingIcatEntity) => {
            const toUpdate = {
                id: datafile.id,
                dataset: {id: dataset.id}
            };
            return icatClient.writeEntity("Datafile", toUpdate);
        },
        scope: {
            id: "asdf"
        },
        onSuccess: () => setSuccessCount(c => c + 1),
        retry: 3
    });

    const isExecuting = moveDfMutation.isPending;

    const executeMove = () => {
        for (const df of datafiles) {
            moveDfMutation.mutate(
                df, {
                    onSettled: () => setSuccessCount(0)
                });
        }
    }

    const suffix = moveDfMutation.isPending
        ? <LoadingIndicator/>
        : <></>
    return <div>
        <WithSuffix suffix={suffix}>
            <button
                type="button"
                disabled={isExecuting}
                onClick={executeMove}>
                Move {datafiles.length} datafiles
            </button>
        </WithSuffix>
        {moveDfMutation.isPending &&
          <p>{successCount}/{datafiles.length} completed</p>}
    </div>
}

export default MoveRunsTool;
