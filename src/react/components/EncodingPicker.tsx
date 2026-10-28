import React, {useEffect, useMemo, useRef, useState} from "react";
import {EncodingAction} from "../../enums";
import {buildEncodingChoices, EncodingChoice, filterEncodingChoices} from "../../domain/EncodingChoices";
import {getAnsiCodePage} from "../EncodingInfo";

const MODES = [
    {action: EncodingAction.REINTERPRET, label: "Reopen", hint: "Read the file again from disk with the chosen encoding."},
    {action: EncodingAction.CONVERT, label: "Convert", hint: "Keep the text as it is and save it with the chosen encoding."},
];

export default function EncodingPicker({action, encoding, hasFile, onActionChange, onSelect, onClose}: {
    action: EncodingAction,
    encoding?: string,
    hasFile: boolean,
    onActionChange: (action: EncodingAction) => void,
    onSelect: (action: EncodingAction, encoding?: string) => void,
    onClose: () => void,
}) {
    const [query, setQuery] = useState("");
    const [ansiCodePage, setAnsiCodePage] = useState<string>();
    const [cursor, setCursor] = useState<number>();
    const listRef = useRef<HTMLDivElement>(null);

    const mode = action === EncodingAction.CONVERT ? EncodingAction.CONVERT : EncodingAction.REINTERPRET;

    useEffect(() => {
        getAnsiCodePage().then(setAnsiCodePage).catch(err => console.error(err));
    }, []);

    const choices = useMemo(() => {
        const all = buildEncodingChoices(ansiCodePage, mode === EncodingAction.REINTERPRET && hasFile);

        return filterEncodingChoices(all, query).filter(c => !(mode === EncodingAction.CONVERT && c.id === encoding));
    }, [ansiCodePage, mode, hasFile, query, encoding]);

    const currentIndex = choices.findIndex(c => c.id === encoding);
    const highlighted = Math.min(choices.length - 1, cursor ?? (query || currentIndex < 0 ? 0 : currentIndex));
    const setHighlighted = (index: number) => setCursor(index);

    const changeMode = (next: EncodingAction) => {
        setCursor(undefined);
        onActionChange(next);
    };

    useEffect(() => {
        listRef.current?.querySelector(".encodingChoice.highlighted")?.scrollIntoView({block: "nearest"});
    }, [highlighted, choices]);

    const choose = (choice: EncodingChoice | undefined) => {
        if (!choice) return;

        onSelect(choice.id ? mode : EncodingAction.REDETECT, choice.id);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setHighlighted(Math.min(choices.length - 1, highlighted + 1));
                break;
            case "ArrowUp":
                event.preventDefault();
                setHighlighted(Math.max(0, highlighted - 1));
                break;
            case "Enter":
                event.preventDefault();
                choose(choices[highlighted]);
                break;
            case "Escape":
                event.preventDefault();
                onClose();
                break;
            case "Tab":
                event.preventDefault();
                changeMode(mode === EncodingAction.CONVERT ? EncodingAction.REINTERPRET : EncodingAction.CONVERT);
                break;
        }
    };

    let lastGroup: string | undefined;

    return (
        <div id={"encodingPickerOverlay"} onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <div id={"encodingPicker"} role={"dialog"} aria-label={"Encoding"} onKeyDown={onKeyDown}>
                <div id={"encodingPickerModes"} role={"tablist"}>
                    {MODES.map(m => (
                        <button key={m.action} role={"tab"} aria-selected={m.action === mode} className={"chip ghost" + (m.action === mode ? " selected" : "")}
                            onClick={() => changeMode(m.action)}>{m.label}</button>
                    ))}
                    <span id={"encodingPickerHint"}>{MODES.find(m => m.action === mode)?.hint}</span>
                </div>
                <input id={"encodingPickerSearch"} type={"text"} autoFocus={true} placeholder={"Search, e.g. 1254, latin, cyrillic"}
                    value={query} onChange={e => {
                        setCursor(undefined);
                        setQuery(e.target.value);
                    }}/>
                <div id={"encodingPickerList"} ref={listRef} role={"listbox"}>
                    {choices.length === 0 && <div className={"encodingPickerEmpty"}>No matching encoding</div>}
                    {choices.map((choice, index) => {
                        const header = choice.group !== lastGroup ? choice.group : undefined;

                        lastGroup = choice.group;

                        return (
                            <React.Fragment key={choice.id || "detect"}>
                                {header && <div className={"encodingGroup"}>{header}</div>}
                                <div role={"option"} aria-selected={index === highlighted}
                                    className={"encodingChoice" + (index === highlighted ? " highlighted" : "")}
                                    onMouseMove={() => index !== highlighted && setHighlighted(index)}
                                    onClick={() => choose(choice)}>
                                    <span className={"encodingChoiceLabel"}>{choice.label}</span>
                                    {choice.id === encoding && <span className={"encodingChoiceCurrent chip current"}>current</span>}
                                    <span className={"encodingChoiceDescription"}>{choice.description}</span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
