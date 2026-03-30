import { config } from "@repo/eslint-config/base"

/** @type {import("eslint").Linter.Config[]} */
const supabaseConfig = [
	...config,
	{
		rules: {
			"turbo/no-undeclared-env-vars": "off",
		},
	},
];

export default supabaseConfig;
