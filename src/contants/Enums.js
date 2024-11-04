export const SupportedLanguages = {
    text: {
        name: "text",
        extensions: [".txt"],
    },

    javascript: {
        name: "javascript",
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },

    xml: {
        name: "xml",
        extensions: [".xml", ".xslt", ".xsl"],
    },

    json: {
        name: "json",
        extensions: [".json"],
    },

    yaml: {
        name: "yaml",
        extensions: [".yml", ".yaml"],
    },

    html: {
        name: "html",
        extensions: [".html"],
    },

    css: {
        name: "css",
        extensions: [".css"],
    },

    markdown: {
        name: "markdown",
        extensions: [".md", ".markdown"],
    },

    java: {
        name: "java",
        extensions: [".java", ".class"],
    },

    findByFileName: (fileName) => {
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
    home: "homeDir"
}
