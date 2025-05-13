import { XMLParser } from "fast-xml-parser";
import type {
	ApiBuilder,
	EpisodeNfoFile,
	EpisodePlexData,
	NfoData,
	PlexMediaTypes,
	PlexMetadataResponse,
	SeasonNfoFile,
	SeasonPlexData,
	UpdateData,
} from "./types";
import { readdir } from "node:fs/promises";
import { exit } from "node:process";

export const acceptJson = {
	Accept: "application/json",
};

export async function keyWizard(api: ApiBuilder) {
	type Library = {
		key: string;
		type: string;
		title: string;
	};
	const libraries: Library[] = (
		await (
			await fetch(api("library/sections"), {
				headers: acceptJson,
			})
		).json()
	).MediaContainer.Directory.sort((a: Library, b: Library) =>
		a.key.localeCompare(b.key),
	);

	let foundLibKey = "";

	while (!foundLibKey) {
		console.log("\tKey | Library");
		console.log("\t--- | -----");
		for (const lib of libraries) {
			console.log(
				`\t${lib.key.padStart(3)} | ${lib.title} (${lib.type})`,
			);
		}
		const entered = prompt("Enter Library Key: ");
		const found = libraries.find((l) => l.key === entered);
		if (found) {
			foundLibKey = found.key;
		}
	}

	const shows: { title: string; ratingKey: string }[] = (
		await (
			await fetch(api(`library/sections/${foundLibKey}/all`), {
				headers: acceptJson,
			})
		).json()
	).MediaContainer.Metadata;

	let foundShowKey = "";
	while (!foundShowKey) {
		const searchString = prompt(
			"Enter show title: ",
			"One Pace",
		)?.toLowerCase();

		const searchResult = shows.filter(
			(i) => i.title.toLowerCase() === searchString,
		);
		if (searchResult.length === 1) {
			foundShowKey = searchResult[0].ratingKey;
		}
	}

	console.log("\nPlease copy the following to your .env file then rerun:\n");
	console.log(`PLEX_LIBRARY_KEY=${foundLibKey}`);
	console.log(`PLEX_ONE_PACE_KEY=${foundShowKey}`);
}

export async function loadNfoData(): Promise<NfoData> {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
	});

	const dirs = (
		await readdir("./data", {
			withFileTypes: true,
		})
	)
		.filter((d) => !d.isFile())
		.map((d) => d.name)
		.sort();

	const sMap = new Map<number, SeasonNfoFile>();
	const epMap = new Map<number, Map<number, EpisodeNfoFile>>();

	for (const season of dirs) {
		const dirPath = "./data/" + season;
		const dir = await readdir("./data/" + season);
		for (const fileName of dir) {
			const filePath = dirPath + "/" + fileName;
			const file = Bun.file(filePath);
			const text = await file.text();
			const parsed = parser.parse(text);
			if ("episodedetails" in parsed) {
				const details: EpisodeNfoFile = parsed["episodedetails"];
				if (!epMap.has(details.season)) {
					epMap.set(details.season, new Map());
				}
				const eps = epMap.get(details.season)!;
				eps.set(details.episode, details);
			} else {
				const details: SeasonNfoFile = parsed["season"];
				sMap.set(details.seasonnumber, details);
			}
		}
	}

	return {
		seasons: sMap,
		episodes: epMap,
	};
}

export const buildMetadataFetch = (api: ApiBuilder) => {
	return async <T>(endpoint: string): Promise<T[]> => {
		const fetchRes = await fetch(api(endpoint), {
			headers: acceptJson,
		});
		const json: PlexMetadataResponse<T> = await fetchRes.json();
		const data = json.MediaContainer.Metadata;
		return Array.isArray(data) ? data : [data];
	};
};

const plexTypes: PlexMediaTypes = {
	season: "3",
	episode: "4",
};

export async function collectPendingUpdates(
	api: ApiBuilder,
	nfo: NfoData,
	onePaceShowKey: string,
): Promise<UpdateData[]> {
	const pendingUpdates: UpdateData[] = [];
	const metadataFetch = buildMetadataFetch(api);

	const seasonList = await metadataFetch<SeasonPlexData>(
		`library/metadata/${onePaceShowKey}/children`,
	);
	for (const season of seasonList) {
		const seasonNum = Number(season.index);

		const sNfo = nfo.seasons.get(seasonNum);
		if (!sNfo) {
			console.error("Missing data for season " + seasonNum);
			exit();
		}
		if (sNfo.title !== season.title) {
			pendingUpdates.push({
				id: season.ratingKey,
				type: plexTypes.season,
				title: sNfo.title,
			});
		}

		const epNfoMap = nfo.episodes.get(seasonNum);
		if (!epNfoMap) {
			console.error("Missing episode data for season " + seasonNum);
			exit();
		}

		const epList = await metadataFetch<EpisodePlexData>(
			`library/metadata/${season.ratingKey}/children`,
		);

		for (const ep of epList) {
			const epNum = Number(ep.index);
			const epNfo = epNfoMap.get(epNum);
			if (!epNfo) {
				console.error(
					"Missing data for episode s" + seasonNum + "e" + epNum,
				);
				exit();
			}
			if (!(epNfo.title === ep.title && epNfo.plot === ep.summary)) {
				pendingUpdates.push({
					id: ep.ratingKey,
					type: plexTypes.episode,
					title: epNfo.title,
					summary: epNfo.plot,
				});
			}
		}
	}
	return pendingUpdates;
}
