import { XMLParser } from "fast-xml-parser";
import { readdir } from "node:fs/promises";
import { exit } from "node:process";
import type {
	ApiBuilder,
	EpisodeNfoFile,
	EpisodePlexData,
	PlexMediaTypes,
	PlexMetadataResponse,
	SeasonNfoFile,
	SeasonPlexData,
	UpdateData,
} from "./src/types";
import {
	acceptJson,
	buildMetadataFetch,
	collectPendingUpdates,
	keyWizard,
	loadNfoData,
} from "./src/util";

const url = Bun.env.PLEX_URL;
if (!url) {
	console.error("Missing PLEX_URL environment variable.");
	exit();
}
const token = Bun.env.PLEX_TOKEN;
if (!token) {
	console.error("Missing PLEX_TOKEN environment variable.");
	exit();
}

const api: ApiBuilder = (endpoint: string, params?: URLSearchParams) => {
	return `${url}/${endpoint}?${!!params ? params.toString() + "&" : ""}X-Plex-Token=${token}`;
};

const libKey = Bun.env.PLEX_LIBRARY_KEY;
const onePaceShowKey = Bun.env.PLEX_ONE_PACE_KEY;
if (!libKey || !onePaceShowKey) {
	await keyWizard(api);
} else {
	const nfo = await loadNfoData();
	const pendingUpdates = await collectPendingUpdates(
		api,
		nfo,
		onePaceShowKey,
	);

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
		if (updateRes.status === 200) {
			console.log("\x1b[32m [ OK ] \x1b[0m" + fields.title);
		} else {
			console.log("\x1b[31m [FAIL] \x1b[0m" + fields.title);
		}
	}
}
