import {CHARACTER_SET_GROUPS, EncodingId, getEncodingLabel, UNICODE_ENCODINGS} from "./Encoding";

export interface EncodingChoice {
    id?: string,
    label: string,
    description: string,
    group: string,
    keywords: string,
}

export function buildEncodingChoices(ansiCodePage: string | undefined, withDetection: boolean): Array<EncodingChoice> {
    const choices: Array<EncodingChoice> = [];

    if (withDetection) {
        choices.push({label: "Detect automatically", description: "Guess the encoding from the file", group: "Automatic", keywords: "detect auto guess"});
    }

    UNICODE_ENCODINGS.forEach(e => {
        const isAnsi = e.id === EncodingId.ANSI;
        const description = isAnsi && ansiCodePage ? `${e.description}, ${getEncodingLabel(ansiCodePage)}` : e.description;

        choices.push({
            id: e.id,
            label: e.label,
            description: description,
            group: isAnsi ? "System" : "Unicode",
            keywords: [e.id, e.label, description, isAnsi ? ansiCodePage || "" : "unicode"].join(" "),
        });
    });

    CHARACTER_SET_GROUPS.forEach(group => group.sets.forEach(set => choices.push({
        id: set.id,
        label: set.label,
        description: group.label,
        group: group.label,
        keywords: [set.id, set.label, group.label].join(" "),
    })));

    return choices;
}

export function filterEncodingChoices(choices: Array<EncodingChoice>, query: string): Array<EncodingChoice> {
    const words = query.toLowerCase().split(/\s+/).filter(w => w);

    if (words.length === 0) return choices;

    const phrase = compact(query);
    const byPhrase = choices.filter(c => compact(c.keywords).includes(phrase));

    if (byPhrase.length > 0) return byPhrase;

    return choices.filter(c => {
        const text = c.keywords.toLowerCase().replace(/[-_]/g, " ") + " " + c.keywords.toLowerCase();

        return words.every(w => text.includes(w));
    });
}

function compact(text: string): string {
    return text.toLowerCase().replace(/[\s\-_()]/g, "");
}
