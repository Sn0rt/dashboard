import { config } from "@volcano/eslint-config/base";

export default [
    ...config,
    {
        ignores: ["node_modules/**", "dist/**", ".test-dist/**", ".turbo/**"],
    },
];
