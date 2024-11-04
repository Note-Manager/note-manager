export class Tab {
    id;
    name;
    file;
    content;
    displayName;

    constructor(id, name, file, content) {
        this.id = id;
        this.name = name;
        this.file = file;
        this.content = content;

        this.displayName = this.name.length > 20 ? this.name.substring(0, 20) + "..." : this.name;
    }
}