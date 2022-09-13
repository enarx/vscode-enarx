export let ENARX_TOML_SCHEMA_DEFINITION = {
    type: "object",
    properties: {
        steward: { type: "string", pattern: "(http|https)://[a-z\-A-Z0-9].[a-z\-A-Z0-9] .[a-zA-Z0-9]" },
        args: { type: "array", items: { type: "string" } },
        env: { type: "object", additionalProperties: { "type": "string" } },
        files: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    kind: {
                        type: "string",
                        enum: ["null", "stdin", "stdout", "stderr", "listen", "connect"]
                    },
                    name: { type: "string" },
                    prot: {
                        type: "string",
                        enum: ["tcp", "tls"]
                    },
                    port: { type: "number", minimum: 1, maximum: 65535 },
                    host: { type: "string" },
                    addr: { type: "string" }
                },
                allOf: [
                    {
                        if: {
                            properties: {
                                kind: {
                                    enum: ["listen", "connect"]
                                },
                            },
                            required: ["kind"]
                        },
                        then: {
                            required: ["prot", "port"]
                        },
                        else: {
                            required: []
                        }
                    },
                    {
                        if: {
                            properties: {
                                kind: {
                                    enum: ["connect"]
                                },
                            },
                            required: ["kind"]
                        },
                        then: {
                            required: ["host"]
                        },
                        else: {
                            required: []
                        }
                    },
                    {
                        if: {
                            properties: {
                                kind: {
                                    enum: ["listen"]
                                },
                            },
                            required: ["kind"]
                        },
                        then: {
                            required: ["addr"]
                        },
                        else: {
                            required: []
                        }
                    }
                ],
            }
        }
    },
    additionalProperties: false,
};