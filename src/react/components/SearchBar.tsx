import React, {RefObject, useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-regular-svg-icons/faClock";
import {SearchMode, SearchTarget} from "../../domain/Search";
import {EditorSearch, SearchStatus} from "../hooks/useEditorSearch";
import {classNames} from "../ClassNames";
import {countOf} from "../../utils/TextUtils";

const SEARCH_TARGETS = [
    {target: SearchTarget.DOCUMENT, label: "This file", title: "Find All and Replace All work in this file"},
    {target: SearchTarget.OPEN_DOCUMENTS, label: "Open tabs", title: "Find All and Replace All work in every open tab"},
];

export default function SearchBar({search}: {search: EditorSearch}) {
    const findRef = useRef<HTMLInputElement>(null);
    const {options} = search;

    useEffect(() => {
        findRef.current?.focus();
        findRef.current?.select();
    }, [search.focusRequest]);

    const onFindKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== "Enter") return;

        event.preventDefault();

        if (event.altKey) search.findAll();
        else if (event.shiftKey) search.findPrevious();
        else search.findNext();
    };

    const onReplaceKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== "Enter") return;

        event.preventDefault();

        if (event.ctrlKey || event.metaKey) search.replaceAll();
        else search.replace();
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== "Escape") return;

        event.preventDefault();
        search.close();
    };

    const toggleMode = (mode: SearchMode) => search.changeOptions({mode: options.mode === mode ? SearchMode.NORMAL : mode});

    return (
        <div id={"searchBar"} role={"search"} onKeyDown={onKeyDown}>
            <button type={"button"} className={"iconButton searchExpander"} aria-expanded={search.isReplace} aria-label={"Toggle replace"} title={"Toggle replace"}
                onClick={search.toggleReplace}>{search.isReplace ? "▾" : "▸"}</button>
            <div className={"searchRows"}>
                <div className={"searchRow"}>
                    <SearchField label={"Find"} inputRef={findRef} value={search.text} history={search.history.find} isInvalid={!!search.status?.error}
                        onChange={search.changeText} onKeyDown={onFindKeyDown}/>
                    <div className={"searchOptions"}>
                        <OptionToggle label={"Aa"} title={"Match case"} isPressed={options.matchCase} onToggle={() => search.changeOptions({matchCase: !options.matchCase})}/>
                        <OptionToggle label={"ab"} title={"Whole word"} isPressed={options.wholeWord} onToggle={() => search.changeOptions({wholeWord: !options.wholeWord})} className={"wholeWord"}/>
                        <OptionToggle label={"\\n"} title={"Extended: \\n \\r \\t \\0 \\xFF \\uFFFF"} isPressed={options.mode === SearchMode.EXTENDED} onToggle={() => toggleMode(SearchMode.EXTENDED)}/>
                        <OptionToggle label={".*"} title={"Regular expression"} isPressed={options.mode === SearchMode.REGEX} onToggle={() => toggleMode(SearchMode.REGEX)}/>
                        {options.mode === SearchMode.REGEX &&
                            <OptionToggle label={".⏎"} title={"Let . match line breaks"} isPressed={options.dotAll} onToggle={() => search.changeOptions({dotAll: !options.dotAll})}/>
                        }
                        <span className={"searchDivider"}/>
                        <OptionToggle label={"⇲"} title={"Search in selection"} isPressed={search.isInSelection} onToggle={search.toggleInSelection}
                            isDisabled={search.target === SearchTarget.OPEN_DOCUMENTS}/>
                        <OptionToggle label={"↻"} title={"Wrap around"} isPressed={options.wrap} onToggle={() => search.changeOptions({wrap: !options.wrap})}/>
                        <span className={"searchDivider"}/>
                        <div className={"searchTargets"} role={"radiogroup"} aria-label={"Search in"}>
                            {SEARCH_TARGETS.map(({target, label, title}) => (
                                <button key={target} type={"button"} role={"radio"} aria-checked={search.target === target} title={title}
                                    className={classNames("chip", "ghost", search.target === target && "selected")}
                                    onMouseDown={event => event.preventDefault()} onClick={() => search.changeTarget(target)}>{label}</button>
                            ))}
                        </div>
                    </div>
                    <span className={classNames("searchStatus", (search.status?.error || search.message) && "notice", search.status?.error && "error")} aria-live={"polite"}>
                        {formatStatus(search.text, search.status, search.message)}
                    </span>
                    <button type={"button"} className={"iconButton"} aria-label={"Previous match"} title={"Previous match (Shift+Enter)"} onClick={search.findPrevious}>↑</button>
                    <button type={"button"} className={"iconButton"} aria-label={"Next match"} title={"Next match (Enter)"} onClick={search.findNext}>↓</button>
                    <button type={"button"} className={"btn"} title={"List every match in the search results (Alt+Enter)"} onClick={() => search.findAll()}>Find All</button>
                    <button type={"button"} className={"iconButton danger"} aria-label={"Close search"} title={"Close (Escape)"} onClick={search.close}>×</button>
                </div>
                {search.isReplace &&
                    <div className={"searchRow"}>
                        <SearchField label={"Replace"} value={search.replacement} history={search.history.replace}
                            onChange={search.changeReplacement} onKeyDown={onReplaceKeyDown}/>
                        <button type={"button"} className={"btn"} title={"Replace (Enter)"} onClick={search.replace}>Replace</button>
                        <button type={"button"} className={"btn"} title={"Replace all (Ctrl+Enter)"} onClick={search.replaceAll}>Replace All</button>
                    </div>
                }
            </div>
        </div>
    );
}

function SearchField({label, inputRef, value, history, isInvalid, onChange, onKeyDown}: {
    label: string,
    inputRef?: RefObject<HTMLInputElement>,
    value: string,
    history: Array<string>,
    isInvalid?: boolean,
    onChange: (value: string) => void,
    onKeyDown: (event: React.KeyboardEvent) => void,
}) {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const fieldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isHistoryOpen) return;

        const closeOutside = (event: MouseEvent) => {
            if (!fieldRef.current?.contains(event.target as Node)) setIsHistoryOpen(false);
        };

        document.addEventListener("mousedown", closeOutside);

        return () => document.removeEventListener("mousedown", closeOutside);
    }, [isHistoryOpen]);

    const choose = (index: number) => {
        setHistoryIndex(index);
        setIsHistoryOpen(false);
        onChange(index < 0 ? "" : history[index]);
    };

    const closeHistoryOnEscape = (event: React.KeyboardEvent) => {
        if (event.key !== "Escape" || !isHistoryOpen) return;

        event.stopPropagation();
        setIsHistoryOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const step = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;

        if (step === 0 || history.length === 0) {
            onKeyDown(event);
            return;
        }

        event.preventDefault();
        choose(Math.min(history.length - 1, Math.max(-1, historyIndex + step)));
    };

    return (
        <div className={"searchField"} ref={fieldRef} onKeyDown={closeHistoryOnEscape}>
            <input ref={inputRef} type={"text"} className={"textField"} spellCheck={false} aria-label={label} placeholder={label} aria-invalid={isInvalid}
                value={value} onKeyDown={handleKeyDown} onChange={event => {
                    setHistoryIndex(-1);
                    onChange(event.target.value);
                }}/>
            <button type={"button"} className={"iconButton"} aria-label={`Recent ${label.toLowerCase()} terms`} title={"Recent terms (Up / Down)"}
                aria-expanded={isHistoryOpen} disabled={history.length === 0} onClick={() => setIsHistoryOpen(current => !current)}>
                <FontAwesomeIcon icon={faClock}/>
            </button>
            {isHistoryOpen &&
                <div className={"searchHistory"} role={"listbox"} aria-label={`Recent ${label.toLowerCase()} terms`}>
                    {history.map((term, index) => (
                        <div key={term} role={"option"} aria-selected={index === historyIndex} className={"searchHistoryItem"}
                            onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>{term}</div>
                    ))}
                </div>
            }
        </div>
    );
}

function OptionToggle({label, title, isPressed, onToggle, className, isDisabled}: {
    label: string,
    title: string,
    isPressed: boolean,
    onToggle: () => void,
    className?: string,
    isDisabled?: boolean,
}) {
    return (
        <button type={"button"} className={classNames("iconButton", "toggle", className)} aria-pressed={isPressed} aria-label={title} title={title}
            disabled={isDisabled} onMouseDown={event => event.preventDefault()} onClick={onToggle}>{label}</button>
    );
}

function formatStatus(text: string, status: SearchStatus | undefined, message: string | undefined): string {
    if (status?.error) return status.error;
    if (message) return message;
    if (!text || !status) return "";
    if (status.count === 0) return "No results";
    if (status.current < 0) return countOf(status.count, "result");

    return `${status.current + 1} of ${status.count}`;
}
