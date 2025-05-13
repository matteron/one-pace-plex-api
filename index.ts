import { exit } from "node:process";
import type { ApiBuilder, ResultCounts } from "./src/types";
import {
	collectPendingUpdates,
	emptyResults,
	keyWizard,
	loadNfoData,
	logCodes,
	logResult,
} from "./src/util";

const url = process.env.PLEX_URL;
if (!url) {
	console.error("Missing PLEX_URL environment variable.");
	exit();
}
const token = process.env.PLEX_TOKEN;
if (!token) {
	console.error("Missing PLEX_TOKEN environment variable.");
	exit();
}

const api: ApiBuilder = (endpoint: string, params?: URLSearchParams) => {
	return `${url}/${endpoint}?${!!params ? params.toString() + "&" : ""}X-Plex-Token=${token}`;
};

const libKey = process.env.PLEX_LIBRARY_KEY;
const onePaceShowKey = process.env.PLEX_ONE_PACE_KEY;
if (!libKey || !onePaceShowKey) {
	await keyWizard(api);
} else {
	const nfo = await loadNfoData();
	const pendingUpdates = await collectPendingUpdates(
		api,
		nfo,
		onePaceShowKey,
	);

	if (!pendingUpdates.length) {
		console.log("\x1b[34mNothing found to update!\x1b[0m");
		exit();
	}

	let results = emptyResults();
	for (const { id, type, ...fields } of pendingUpdates) {
		const params = new URLSearchParams();
		params.append("type", type);
		params.append("id", id);
		params.append("includeExternalMedia", "1");
		for (const [key, value] of Object.entries(fields)) {
			params.append(key + ".value", value);
			params.append(key + ".locked", "1");
		}
		const updateRes = await fetch(
			api(`library/sections/${libKey}/all`, params),
			{
				method: "PUT",
			},
		);
		results = logResult(updateRes, type, fields.title, results);
	}

	const sLen = "Seasons".length;
	const eLen = "Episodes".length;
	console.log("\n Results | Seasons | Episodes");
	const formatOutput = (code: string, count: ResultCounts) =>
		` ${code}| ${(count.seasons + "").padStart(sLen)} | ${(count.episodes + "").padStart(eLen)}`;

	console.log(formatOutput(logCodes.ok, results.success));
	console.log(formatOutput(logCodes.fail, results.error));
}
