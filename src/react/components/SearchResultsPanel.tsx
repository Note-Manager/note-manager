import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrashCan} from "@fortawesome/free-regular-svg-icons/faTrashCan";
import {faTimesRectangle} from "@fortawesome/free-regular-svg-icons/faTimesRectangle";
import {faCircleStop} from "@fortawesome/free-regular-svg-icons/faCircleStop";
import PanelResizer, {ResizeAxis} from "./PanelResizer";
import {SEARCH_RESULTS_PANEL} from "./PanelSizes";
import {SearchTarget} from "../../domain/Search";
import {createResultRows, describeHit, hitKey, ResultRow, SearchRun} from "../../utils/SearchResults";
import {SearchResults} from "../hooks/useSearchResults";
import {classNames} from "../ClassNames";
import {countOf} from "../../utils/TextUtils";

const OVERSCAN = 10;
const ROW_HEIGHT_TOKEN = "--control-height-sm";

export default function SearchResultsPanel({results, height, onResize}: {results: SearchResults, height: number, onResize: (height: number) => void}) {
    const listRef = useRef<HTMLDivElement>(null);
    const [cursorKey, setCursorKey] = useState<string>();
    const [viewport, setViewport] = useState({top: 0, height: 0, rowHeight: 1});

    const rows = useMemo(() => createResultRows(results.runs, results.collapsed), [results.runs, results.collapsed]);
    const cursorIndex = Math.max(0, cursorKey ? rows.indexOf(cursorKey) : 0);
    const cursorRow = rows.at(cursorIndex);
    const firstRow = Math.max(0, Math.floor(viewport.top / viewport.rowHeight) - OVERSCAN);
    const lastRow = Math.min(rows.length, Math.ceil((viewport.top + viewport.height) / viewport.rowHeight) + OVERSCAN);
    const visibleRows = Array.from({length: Math.max(0, lastRow - firstRow)}, (_, offset) => ({row: rows.at(firstRow + offset) as ResultRow, index: firstRow + offset}));
    const activeKey = results.activeHit && hitKey(results.activeHit);

    useLayoutEffect(() => {
        const list = listRef.current;

        if (!list) return;

        const measure = () => setViewport({
            top: list.scrollTop,
            height: list.clientHeight,
            rowHeight: parseFloat(getComputedStyle(list).getPropertyValue(ROW_HEIGHT_TOKEN)) || 1,
        });
        const observer = new ResizeObserver(measure);

        measure();
        observer.observe(list);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const list = listRef.current;

        if (!list) return;

        list.scrollTop = 0;
        list.focus();
        setCursorKey(undefined);
    }, [results.focusRequest]);

    useEffect(() => {
        const active = results.activeHit;

        if (active) moveCursor(rows.indexOf(hitKey(active)));
    }, [results.activeHit]);

    const moveCursor = (index: number) => {
        const list = listRef.current;
        const row = rows.at(index);

        if (!list || !row) return;

        setCursorKey(row.key);

        const top = index * viewport.rowHeight;

        if (top < list.scrollTop) list.scrollTop = top;
        else if (top + viewport.rowHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + viewport.rowHeight - list.clientHeight;
    };

    const activate = (row: ResultRow) => {
        setCursorKey(row.key);

        if (row.kind === "hit") results.openHit(row.address);
        else results.toggleCollapsed(row.key);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        const row = cursorRow;
        const isCollapsed = row && results.collapsed.has(row.key);
        const actions: Record<string, () => void> = {
            ArrowDown: () => moveCursor(Math.min(rows.length - 1, cursorIndex + 1)),
            ArrowUp: () => moveCursor(Math.max(0, cursorIndex - 1)),
            Home: () => moveCursor(0),
            End: () => moveCursor(rows.length - 1),
            Enter: () => row && activate(row),
            ArrowRight: () => row && row.kind !== "hit" && isCollapsed && results.toggleCollapsed(row.key),
            ArrowLeft: () => row && row.kind !== "hit" && !isCollapsed && results.toggleCollapsed(row.key),
            Delete: () => row && results.removeRun(row.run.id),
            Escape: results.close,
        };
        const action = actions[event.key];

        if (!action) return;

        event.preventDefault();
        action();
    };

    return (
        <>
            <PanelResizer panel={SEARCH_RESULTS_PANEL} axis={ResizeAxis.VERTICAL} size={height} onResize={onResize}/>
            <section id={"searchResults"} aria-label={"Search results"} style={{height: height + "px"}}>
                <div className={"searchResultsHeader"}>
                    <span className={"searchResultsTitle"}>Search Results</span>
                    <button type={"button"} className={"iconButton"} aria-label={"Clear search results"} title={"Clear search results"}
                        disabled={results.runs.length === 0} onClick={results.clear}>
                        <FontAwesomeIcon icon={faTrashCan}/>
                    </button>
                    <button type={"button"} className={"iconButton danger"} aria-label={"Close search results"} title={"Close search results (Escape)"} onClick={results.close}>
                        <FontAwesomeIcon icon={faTimesRectangle}/>
                    </button>
                </div>
                <div className={"searchResultsList"} ref={listRef} role={"tree"} tabIndex={0} aria-label={"Search results"}
                    aria-activedescendant={cursorRow && rowId(cursorRow)}
                    onKeyDown={onKeyDown}
                    onScroll={event => {
                        const top = event.currentTarget.scrollTop;

                        setViewport(current => ({...current, top: top}));
                    }}>
                    {rows.length === 0 && <div className={"searchResultsEmpty"}>Use Find All to list every match here.</div>}
                    <div className={"searchResultsCanvas"} style={{height: rows.length * viewport.rowHeight + "px"}}>
                        {visibleRows.map(({row, index}) => (
                            <ResultRowView key={row.key} row={row} top={index * viewport.rowHeight}
                                isCursor={index === cursorIndex}
                                isActive={row.key === activeKey}
                                isCollapsed={results.collapsed.has(row.key)}
                                onActivate={() => activate(row)}
                                onRemove={() => results.removeRun(row.run.id)}
                                onCancel={() => results.cancelRun(row.run.id)}/>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

function ResultRowView({row, top, isCursor, isActive, isCollapsed, onActivate, onRemove, onCancel}: {
    row: ResultRow,
    top: number,
    isCursor: boolean,
    isActive: boolean,
    isCollapsed: boolean,
    onActivate: () => void,
    onRemove: () => void,
    onCancel: () => void,
}) {
    const isRunning = row.kind === "run" && !!row.run.progress && !row.run.progress.isDone;

    return (
        <div id={rowId(row)} role={"treeitem"} className={classNames("searchResultRow", row.kind, isCursor && "cursor")} style={{top: top + "px"}}
            aria-level={row.kind === "run" ? 1 : row.kind === "document" ? 2 : 3}
            aria-expanded={row.kind === "hit" ? undefined : !isCollapsed}
            aria-selected={isActive}
            onMouseDown={event => event.preventDefault()}
            onClick={onActivate}>
            {row.kind !== "hit" && <span className={"searchResultTwisty"} aria-hidden={true}>{isCollapsed ? "▸" : "▾"}</span>}
            <RowContent row={row}/>
            {isRunning &&
                <button type={"button"} className={"iconButton running"} tabIndex={-1} aria-label={"Stop this search"} title={"Stop this search"}
                    onClick={event => {
                        event.stopPropagation();
                        onCancel();
                    }}>
                    <FontAwesomeIcon icon={faCircleStop}/>
                </button>
            }
            {row.kind === "run" &&
                <button type={"button"} className={"iconButton danger"} tabIndex={-1} aria-label={"Remove this search"} title={"Remove this search (Delete)"}
                    onClick={event => {
                        event.stopPropagation();
                        onRemove();
                    }}>×</button>
            }
        </div>
    );
}

function RowContent({row}: {row: ResultRow}) {
    if (row.kind === "run") {
        return (
            <span className={"searchResultLabel"}>
                <span className={"searchResultQuery"}>{row.run.query.text}</span>
                <span className={"searchResultMeta"}>{describeRun(row.run)}</span>
            </span>
        );
    }

    if (row.kind === "document") {
        return (
            <span className={"searchResultLabel"} title={row.document.file}>
                <span>{row.document.name}</span>
                <span className={"searchResultMeta"}>{countOf(row.document.hits.length, "hit")}</span>
                {row.document.file && row.run.target !== SearchTarget.FOLDER && <span className={"searchResultMeta"}>{row.document.file}</span>}
            </span>
        );
    }

    const {start, preview} = describeHit(row.document, row.hit);

    return (
        <span className={"searchResultLabel"}>
            <span className={"searchResultLine"}>{start.row + 1}</span>
            <span className={"searchResultPreview"}>{preview.before}<mark>{preview.match}</mark>{preview.after}</span>
        </span>
    );
}

function describeRun({hitCount, documents, target, directory, progress}: SearchRun): string {
    const isFolder = target === SearchTarget.FOLDER;
    const parts = [
        `${countOf(hitCount, "hit")} in ${countOf(documents.length, isFolder ? "file" : "document")}`,
        isFolder ? directory : target === SearchTarget.OPEN_DOCUMENTS ? "open tabs" : "this file",
    ];

    if (progress?.error) parts.push("failed: " + progress.error);
    else if (progress?.isCancelled) parts.push(`stopped after ${countOf(progress.scanned, "file")}`);
    else if (progress && !progress.isDone) parts.push(`searching, ${countOf(progress.scanned, "file")} read`);

    return parts.join(" · ");
}

function rowId(row: ResultRow): string {
    return "searchResult-" + row.key.replace(/\//g, "-");
}
