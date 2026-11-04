// Summarises differences between two extracted Cloudflare Images specs as
// Markdown. Used by the weekly API drift workflow.
//
// Usage: node scripts/openapi-diff.mjs <old.json> <new.json>
import { readFile } from "node:fs/promises";

const MAX_LINES = 60;

function operations(spec) {
	const out = new Map();
	for (const [path, item] of Object.entries(spec.paths ?? {})) {
		for (const [method, op] of Object.entries(item)) {
			if (method !== "parameters")
				out.set(`${method.toUpperCase()} ${path}`, op);
		}
	}
	return out;
}

function show(value) {
	const text = JSON.stringify(value);
	return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function diff(a, b, path, out) {
	if (JSON.stringify(a) === JSON.stringify(b)) return;
	const bothObjects =
		a &&
		b &&
		typeof a === "object" &&
		typeof b === "object" &&
		!Array.isArray(a) &&
		!Array.isArray(b);
	if (!bothObjects) {
		if (a === undefined) out.push(`+ \`${path}\`: ${show(b)}`);
		else if (b === undefined) out.push(`- \`${path}\` (was ${show(a)})`);
		else out.push(`~ \`${path}\`: ${show(a)} → ${show(b)}`);
		return;
	}
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
		diff(a[key], b[key], `${path}/${key}`, out);
	}
}

const [oldPath, newPath] = process.argv.slice(2);
if (!oldPath || !newPath) {
	console.error("Usage: node scripts/openapi-diff.mjs <old.json> <new.json>");
	process.exit(2);
}
const before = JSON.parse(await readFile(oldPath, "utf8"));
const after = JSON.parse(await readFile(newPath, "utf8"));

const lines = [];
const oldOps = operations(before);
const newOps = operations(after);
for (const name of oldOps.keys()) {
	if (!newOps.has(name)) lines.push(`- **Removed operation** \`${name}\``);
}

const changes = [];
diff(before.paths, after.paths, "paths", changes);
diff(before.components, after.components, "components", changes);

if (lines.length === 0 && changes.length === 0) {
	console.log("No differences.");
} else {
	console.log(lines.join("\n"));
	if (changes.length) {
		console.log(`\n${changes.length} changed field(s):\n\n\`\`\`diff`);
		console.log(changes.slice(0, MAX_LINES).join("\n"));
		if (changes.length > MAX_LINES) {
			console.log(`... and ${changes.length - MAX_LINES} more`);
		}
		console.log("```");
	}
}
