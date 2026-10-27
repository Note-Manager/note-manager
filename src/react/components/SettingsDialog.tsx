import React, {useEffect, useState} from "react";
import {fireEvent, off, on} from "../ApplicationEvents";
import {EventType} from "../../enums";
import {
    DEFAULT_SETTINGS,
    EditorSettings,
    FileSettings,
    findShortcutConflicts,
    FONT_SIZE_RANGE,
    InterfaceSettings,
    keyEventToAccelerator,
    normalizeSettings,
    resolveAccelerator,
    Settings,
    TAB_SIZE_RANGE,
    TabLayout
} from "../../domain/Settings";
import {getShortcutDefinitions, ShortcutDefinition} from "../../utils/Shortcuts";
import {isValidThemeName, isValidVariableValue, ThemeVariable} from "../../utils/ThemeVariables";
import {CHARACTER_SET_GROUPS, EOL_TYPES, EolType, UNICODE_ENCODINGS} from "../../domain/Encoding";

interface ThemeInfo {
    name: string,
    file: string,
    isUser: boolean,
}

enum Section {
    APPEARANCE = "Appearance",
    EDITOR = "Editor",
    INTERFACE = "Interface",
    FILES = "Files",
    SHORTCUTS = "Shortcuts",
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default function SettingsDialog({onClose}: {onClose: () => void}) {
    const [draft, setDraft] = useState<Settings>();
    const [themes, setThemes] = useState<Array<ThemeInfo>>([]);
    const [themeFile, setThemeFile] = useState<string>();
    const [variables, setVariables] = useState<Array<ThemeVariable>>([]);
    const [changedVariables, setChangedVariables] = useState<Record<string, string>>({});
    const [newThemeName, setNewThemeName] = useState("");
    const [section, setSection] = useState(Section.APPEARANCE);
    const [recordingId, setRecordingId] = useState<string>();
    const [error, setError] = useState<string>();

    const [shortcuts, setShortcuts] = useState<Array<ShortcutDefinition>>(() => getShortcutDefinitions());
    const selectedTheme = themes.find(t => t.file === themeFile);

    useEffect(() => {
        fireEvent(EventType.GET_SETTINGS).then(result => {
            setDraft(normalizeSettings(result?.settings));
            setThemes(result?.themes || []);
            setThemeFile(result?.themeFile);
            if (Array.isArray(result?.shortcuts)) setShortcuts(result.shortcuts);
        }).catch(err => setError("Cannot load settings: " + err));
    }, []);

    useEffect(() => {
        if (!themeFile) return;

        fireEvent(EventType.GET_THEME_VARIABLES, {file: themeFile})
            .then(result => setVariables(result || []))
            .catch(err => setError("Cannot read theme: " + err));
    }, [themeFile]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !recordingId) onClose();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [recordingId]);

    useEffect(() => {
        if (!recordingId) return;

        const onShortcutKey = (event: any, key: {code: string, ctrlKey: boolean, metaKey: boolean, altKey: boolean, shiftKey: boolean}) => {
            if (key.code === "Escape") {
                setRecordingId(undefined);
                return;
            }

            if ((key.code === "Backspace" || key.code === "Delete") && !key.ctrlKey && !key.metaKey && !key.altKey && !key.shiftKey) {
                setKeyBinding(recordingId, "");
                setRecordingId(undefined);
                return;
            }

            const accelerator = keyEventToAccelerator(key);

            if (accelerator) {
                setKeyBinding(recordingId, accelerator);
                setRecordingId(undefined);
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            event.stopPropagation();

            onShortcutKey(undefined, event);
        };

        on(EventType.SHORTCUT_KEY, onShortcutKey);
        window.addEventListener("keydown", onKeyDown, true);
        fireEvent(EventType.RECORD_SHORTCUT, {active: true}).catch(err => console.error(err));

        return () => {
            off(EventType.SHORTCUT_KEY, onShortcutKey);
            window.removeEventListener("keydown", onKeyDown, true);
            fireEvent(EventType.RECORD_SHORTCUT, {active: false}).catch(err => console.error(err));
        };
    }, [recordingId, draft]);

    if (!draft) {
        return (
            <div id={"settingsOverlay"}>
                <div id={"settingsDialog"}>{error || "Loading settings..."}</div>
            </div>
        );
    }

    const setEditor = (changes: Partial<EditorSettings>) => setDraft({...draft, editor: {...draft.editor, ...changes}});
    const setInterface = (changes: Partial<InterfaceSettings>) => setDraft({...draft, ui: {...draft.ui, ...changes}});
    const setFiles = (changes: Partial<FileSettings>) => setDraft({...draft, files: {...draft.files, ...changes}});

    function setKeyBinding(id: string, accelerator: string | undefined) {
        setDraft(current => {
            if (!current) return current;

            const keyBindings = {...current.keyBindings};

            if (accelerator === undefined) delete keyBindings[id];
            else keyBindings[id] = accelerator;

            return {...current, keyBindings: keyBindings};
        });
    }

    const shortcutRows = shortcuts.map(s => ({...s, accelerator: resolveAccelerator(draft, s.id, s.defaultAccelerator)}));
    const conflicts = findShortcutConflicts(shortcutRows);
    const invalidVariables = Object.entries(changedVariables).filter(([, value]) => !isValidVariableValue(value)).map(([name]) => name);

    const selectTheme = (file: string) => {
        setChangedVariables({});
        setThemeFile(file);
    }

    const createTheme = () => {
        if (!themeFile) return;

        setError(undefined);

        fireEvent(EventType.CREATE_THEME, {name: newThemeName.trim(), baseFile: themeFile}).then(result => {
            setThemes(result.themes);
            selectTheme(result.file);
            setNewThemeName("");
        }).catch(err => setError("Cannot create theme: " + err));
    }

    const save = () => {
        if (conflicts.size > 0 || invalidVariables.length > 0) return;

        setError(undefined);

        fireEvent(EventType.SAVE_SETTINGS, {
            settings: draft,
            themeFile: themeFile,
            themeVariables: selectedTheme?.isUser && Object.keys(changedVariables).length > 0 ? {file: themeFile, values: changedVariables} : undefined,
        }).then(onClose).catch(err => setError("Cannot save settings: " + err));
    }

    return (
        <div id={"settingsOverlay"} onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <div id={"settingsDialog"} role={"dialog"} aria-label={"Settings"}>
                <div id={"settingsNav"}>
                    {Object.values(Section).map(s => (
                        <div key={s} className={"settingsNavItem" + (s === section ? " selected" : "")} onClick={() => setSection(s)}>{s}</div>
                    ))}
                </div>
                <div id={"settingsBody"}>
                    <div id={"settingsContent"}>
                        {section === Section.APPEARANCE &&
                            <>
                                <h3>Font</h3>
                                <label className={"settingsRow"}>
                                    <span>Font family</span>
                                    <input type={"text"} value={draft.editor.fontFamily} onChange={e => setEditor({fontFamily: e.target.value})}/>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Font size</span>
                                    <input type={"number"} min={FONT_SIZE_RANGE.min} max={FONT_SIZE_RANGE.max} value={draft.editor.fontSize}
                                           onChange={e => setEditor({fontSize: Number(e.target.value)})}/>
                                </label>

                                <h3>Theme</h3>
                                <label className={"settingsRow"}>
                                    <span>Theme</span>
                                    <select value={themeFile} onChange={e => selectTheme(e.target.value)}>
                                        {themes.map(t => <option key={t.file} value={t.file}>{t.name + (t.isUser ? " (user)" : "")}</option>)}
                                    </select>
                                </label>
                                <div className={"settingsRow"}>
                                    <span>New theme from this one</span>
                                    <div className={"settingsInline"}>
                                        <input type={"text"} placeholder={"Theme name"} value={newThemeName} onChange={e => setNewThemeName(e.target.value)}/>
                                        <button disabled={!isValidThemeName(newThemeName.trim())} onClick={createTheme}>Create</button>
                                    </div>
                                </div>
                                {!selectedTheme?.isUser &&
                                    <div className={"settingsHint"}>Bundled themes cannot be changed. Create a new theme from it to customize the colors.</div>
                                }
                                <div id={"themeVariables"}>
                                    {variables.map(v => {
                                        const value = changedVariables[v.name] ?? v.value;

                                        return (
                                            <label key={v.name} className={"settingsRow" + (invalidVariables.includes(v.name) ? " invalid" : "")}>
                                                <span>{v.name}</span>
                                                <div className={"settingsInline"}>
                                                    {HEX_COLOR.test(value) &&
                                                        <input type={"color"} value={value} disabled={!selectedTheme?.isUser}
                                                               onChange={e => setChangedVariables({...changedVariables, [v.name]: e.target.value})}/>
                                                    }
                                                    <input type={"text"} value={value} disabled={!selectedTheme?.isUser}
                                                           onChange={e => setChangedVariables({...changedVariables, [v.name]: e.target.value})}/>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </>
                        }

                        {section === Section.EDITOR &&
                            <>
                                <h3>Editor</h3>
                                <label className={"settingsRow"}>
                                    <span>Wrap long lines</span>
                                    <input type={"checkbox"} checked={draft.editor.wrap} onChange={e => setEditor({wrap: e.target.checked})}/>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Indent with spaces</span>
                                    <input type={"checkbox"} checked={draft.editor.useSoftTabs} onChange={e => setEditor({useSoftTabs: e.target.checked})}/>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Tab size</span>
                                    <input type={"number"} min={TAB_SIZE_RANGE.min} max={TAB_SIZE_RANGE.max} value={draft.editor.tabSize}
                                           onChange={e => setEditor({tabSize: Number(e.target.value)})}/>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Show line numbers</span>
                                    <input type={"checkbox"} checked={draft.editor.showLineNumbers} onChange={e => setEditor({showLineNumbers: e.target.checked})}/>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Show whitespace characters</span>
                                    <input type={"checkbox"} checked={draft.editor.showInvisibles} onChange={e => setEditor({showInvisibles: e.target.checked})}/>
                                </label>
                            </>
                        }

                        {section === Section.INTERFACE &&
                            <>
                                <h3>Tabs</h3>
                                {[
                                    [TabLayout.SCROLL, "Single row, scroll when full"],
                                    [TabLayout.WRAP, "Wrap into multiple rows"],
                                    [TabLayout.VERTICAL, "Vertical list on the left"],
                                ].map(([layout, label]) => (
                                    <label key={layout} className={"settingsRow"}>
                                        <span>{label}</span>
                                        <input type={"radio"} name={"tabLayout"} checked={draft.ui.tabLayout === layout}
                                               onChange={() => setInterface({tabLayout: layout as TabLayout})}/>
                                    </label>
                                ))}
                                <h3>Window</h3>
                                <label className={"settingsRow"}>
                                    <span>Start maximized</span>
                                    <input type={"checkbox"} checked={draft.ui.startMaximized} onChange={e => setInterface({startMaximized: e.target.checked})}/>
                                </label>
                            </>
                        }

                        {section === Section.FILES &&
                            <>
                                <h3>New files</h3>
                                <label className={"settingsRow"}>
                                    <span>Line endings</span>
                                    <select value={draft.files.defaultEol} onChange={e => setFiles({defaultEol: e.target.value as EolType})}>
                                        {EOL_TYPES.map(eol => <option key={eol.id} value={eol.id}>{`${eol.label} (${eol.description})`}</option>)}
                                    </select>
                                </label>
                                <label className={"settingsRow"}>
                                    <span>Encoding</span>
                                    <select value={draft.files.defaultEncoding} onChange={e => setFiles({defaultEncoding: e.target.value})}>
                                        {UNICODE_ENCODINGS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                        {CHARACTER_SET_GROUPS.map(group => (
                                            <optgroup key={group.label} label={group.label}>
                                                {group.sets.map(set => <option key={set.id} value={set.id}>{set.label}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </label>
                                <h3>Opening files</h3>
                                <label className={"settingsRow"}>
                                    <span>Guess the encoding of files without a BOM</span>
                                    <input type={"checkbox"} checked={draft.files.autodetectEncoding}
                                           onChange={e => setFiles({autodetectEncoding: e.target.checked})}/>
                                </label>
                                <div className={"settingsHint"}>Files that are not valid UTF-8 are matched against the known character sets. When this is off, or the guess is unsure, the system code page (ANSI) is used.</div>
                                <label className={"settingsRow"}>
                                    <span>Treat plain ASCII files as UTF-8</span>
                                    <input type={"checkbox"} checked={draft.files.asciiAsUtf8}
                                           onChange={e => setFiles({asciiAsUtf8: e.target.checked})}/>
                                </label>
                                <div className={"settingsHint"}>When this is off, files with only ASCII characters are shown as ANSI. The bytes are the same either way; it only changes the encoding used once you type other characters.</div>
                            </>
                        }

                        {section === Section.SHORTCUTS &&
                            <>
                                <h3>Keyboard shortcuts</h3>
                                <div className={"settingsHint"}>Click a shortcut and press the new keys. Backspace removes it, Escape cancels.</div>
                                {shortcutRows.map(s => (
                                    <div key={s.id} className={"settingsRow" + (conflicts.has(s.id) ? " invalid" : "")}>
                                        <span>{s.label}</span>
                                        <div className={"settingsInline"}>
                                            <button className={"shortcutButton"} onClick={() => setRecordingId(recordingId === s.id ? undefined : s.id)}>
                                                {recordingId === s.id ? "Press keys..." : (s.accelerator || "None")}
                                            </button>
                                            <button disabled={draft.keyBindings[s.id] === undefined} onClick={() => setKeyBinding(s.id, undefined)}>Reset</button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        }
                    </div>
                    <div id={"settingsFooter"}>
                        <span className={"settingsError"}>
                            {error || (conflicts.size > 0 ? "Some shortcuts use the same keys." : invalidVariables.length > 0 ? "Some theme values are not valid." : "")}
                        </span>
                        <button onClick={() => setDraft({...DEFAULT_SETTINGS, keyBindings: {}})}>Restore defaults</button>
                        <button onClick={onClose}>Cancel</button>
                        <button className={"primary"} disabled={conflicts.size > 0 || invalidVariables.length > 0} onClick={save}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
