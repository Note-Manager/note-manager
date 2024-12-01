export const SupportedLanguages = {
    text: {
        name: "text",
        label: "Text",
        extensions: [".txt"],
    },

    javascript: {
        name: "javascript",
        label: "JavaScript",
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },

    xml: {
        name: "xml",
        label: "XML",
        extensions: [".xml", ".xslt", ".xsl"],
    },

    json: {
        name: "json",
        label: "JSON",
        extensions: [".json"],
    },

    yaml: {
        name: "yaml",
        label: "YAML",
        extensions: [".yml", ".yaml"],
    },

    html: {
        name: "html",
        label: "HTML",
        extensions: [".html"],
    },

    css: {
        name: "css",
        label: "CSS",
        extensions: [".css"],
    },

    markdown: {
        name: "markdown",
        label: "Markdown",
        extensions: [".md", ".markdown"],
    },

    java: {
        name: "java",
        label: "Java",
        extensions: [".java", ".class"],
    },

    findByFileName: (fileName) => {
        if(!fileName) return SupportedLanguages.text;

        const extension = fileName && "." + fileName.split(".").pop();

        for (const [key, value] of Object.entries(SupportedLanguages)) {
            if (value.extensions?.includes(extension)) {
                return SupportedLanguages[key];
            }
        }

        return SupportedLanguages.text;
    }
}

export const SystemPaths = {
    temp: "tempDir",
    home: "homeDir",
    data: "dataPath",
    resources: "resources"
}
