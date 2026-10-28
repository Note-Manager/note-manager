import React, {useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {MessageKind, DialogRole} from "../../enums";
import {getCancelAction, getInitialFocusIndex, orderDialogActions} from "../../domain/Dialog";
import {dismissNotice, OpenDialog, ShownNotice, useDialogState} from "../Dialogs";
import {useModalFocus} from "../hooks/useModalFocus";
import {useAutoDismiss} from "../hooks/useAutoDismiss";
import {classNames} from "../ClassNames";

const SEVERITY_GLYPHS: Record<MessageKind, string> = {
    [MessageKind.INFO]: "i",
    [MessageKind.WARNING]: "!",
    [MessageKind.ERROR]: "×",
    [MessageKind.QUESTION]: "?",
    [MessageKind.SUCCESS]: "✓",
};

const LEADING_ROLES = [DialogRole.DESTRUCTIVE, DialogRole.SECONDARY];

export default function DialogHost() {
    const {dialogs, notices} = useDialogState();
    const current = dialogs[0];

    return (
        <>
            {current && <MessageDialogBox key={current.id} open={current}/>}

            {notices.length > 0 &&
                <div className={"toast-stack"} role={"region"} aria-label={"Notifications"}>
                    {notices.map(n => <Toast key={n.id} notice={n}/>)}
                </div>
            }
        </>
    );
}

function SeverityIcon({kind}: {kind: MessageKind}) {
    return <span className={classNames("severityIcon", kind)} aria-hidden={true}>{SEVERITY_GLYPHS[kind]}</span>;
}

function MessageDialogBox({open}: {open: OpenDialog}) {
    const {dialog, answer} = open;
    const containerRef = useRef<HTMLDivElement>(null);
    const initialFocusRef = useRef<HTMLButtonElement>(null);
    const trapFocus = useModalFocus(containerRef, initialFocusRef);
    const initialFocusIndex = getInitialFocusIndex(dialog);
    const titleId = `dialogTitle${open.id}`;
    const messageId = `dialogMessage${open.id}`;

    const onKeyDown = (event: React.KeyboardEvent) => {
        event.stopPropagation();

        if (event.key === "Escape") return answer(dialog.actions.indexOf(getCancelAction(dialog)));

        trapFocus(event);
    };

    return (
        <div className={"dialog-backdrop"}>
            <div ref={containerRef} className={"dialog messageDialog"} role={"alertdialog"} aria-modal={true} aria-labelledby={titleId} aria-describedby={messageId} onKeyDown={onKeyDown}>
                <div className={"dialog-header"} id={titleId}>{dialog.title}</div>
                <div className={"dialog-body messageDialogBody"}>
                    <SeverityIcon kind={dialog.kind}/>
                    <div className={"messageDialogText"} id={messageId}>
                        <div className={"messageDialogMessage"}>{dialog.message}</div>
                        {dialog.detail && <div className={"messageDialogDetail"}>{dialog.detail}</div>}
                    </div>
                </div>
                <div className={"dialog-footer"}>
                    {orderDialogActions(dialog.actions).map(({action, index}, position) => (
                        <button type={"button"}
                            key={index}
                            ref={index === initialFocusIndex ? initialFocusRef : undefined}
                            className={classNames(
                                "btn",
                                action.role === DialogRole.PRIMARY && "primary",
                                action.role === DialogRole.DESTRUCTIVE && "danger",
                                position === 0 && LEADING_ROLES.includes(action.role) && "leading"
                            )}
                            onClick={() => answer(index)}>
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Toast({notice}: {notice: ShownNotice}) {
    const dismiss = () => dismissNotice(notice.id);

    useAutoDismiss(notice.kind, dismiss);

    return (
        <div className={classNames("toast", notice.kind)} role={notice.kind === MessageKind.ERROR ? "alert" : "status"}>
            <SeverityIcon kind={notice.kind}/>
            <div className={"toastText"}>
                <div className={"toastMessage"}>{notice.message}</div>
                {notice.detail && <div className={"toastDetail"}>{notice.detail}</div>}
            </div>
            <button type={"button"} className={"iconButton"} aria-label={"Dismiss"} title={"Dismiss"} onClick={dismiss}>
                <FontAwesomeIcon icon={faRectangleTimes}/>
            </button>
        </div>
    );
}
