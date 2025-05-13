import { XMLParser } from "fast-xml-parser";
import { readdir } from "node:fs/promises";
import { exit } from "node:process";

const url = Bun.env.PLEX_URL;
if (!url) {
	throw new Error("Missing PLEX_URL environment variable.");
}
const token = Bun.env.PLEX_TOKEN;
if (!token) {
	throw new Error("Missing PLEX_TOKEN environment variable.");
}

const api = (endpoint: string, params?: URLSearchParams) => {
	return `${url}/${endpoint}?${!!params ? params.toString() + "&" : ""}X-Plex-Token=${token}`;
};
const acceptJson = {
	Accept: "application/json",
};

const libKey = Bun.env.PLEX_LIBRARY_KEY;
const onePaceShowKey = Bun.env.PLEX_ONE_PACE_KEY;
if (!libKey || !onePaceShowKey) {
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

	exit();
}

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

type EpisodeDetails = {
	title: string;
	season: number;
	episode: number;
	plot: string;
	premiered: string;
};

type SeasonDetails = {
	title: string;
	seasonnumber: number;
};

const sMap = new Map<number, SeasonDetails>();
const epMap = new Map<number, Map<number, EpisodeDetails>>();

for (const season of dirs) {
	const dirPath = "./data/" + season;
	const dir = await readdir("./data/" + season);
	for (const fileName of dir) {
		const filePath = dirPath + "/" + fileName;
		const file = Bun.file(filePath);
		const text = await file.text();
		const parsed = parser.parse(text);
		if ("episodedetails" in parsed) {
			const details: EpisodeDetails = parsed["episodedetails"];
			if (!epMap.has(details.season)) {
				epMap.set(details.season, new Map());
			}
			const eps = epMap.get(details.season)!;
			eps.set(details.episode, details);
		} else {
			const details: SeasonDetails = parsed["season"];
			sMap.set(details.seasonnumber, details);
		}
	}
}

type SeasonInfo = {
	index: string;
	ratingKey: string;
	title: string;
	summary: string;
};

const seasonKeyMap = new Map<number, string>();
const seasonList: SeasonInfo[] = (
	await (
		await fetch(api(`library/metadata/${onePaceShowKey}/children`), {
			headers: acceptJson,
		})
	).json()
).MediaContainer.Metadata;
for (const s of seasonList) {
	const seasonNum = Number(s.index);
	seasonKeyMap.set(seasonNum, s.ratingKey);
}

const episodeKeyMap = new Map<number, Map<number, string>>();

type EpisodeInfo = {
	title: string;
	summary: string;
	ratingKey: string;
	index: string;
};
for (const [season, seasonKey] of seasonKeyMap.entries()) {
	const epList: {
		MediaContainer: {
			Metadata: EpisodeInfo[] | EpisodeInfo;
		};
	} = await (
		await fetch(api(`library/metadata/${seasonKey}/children`), {
			headers: {
				Accept: "application/json",
			},
		})
	).json();
	const epData = epList.MediaContainer.Metadata;
	const eps = Array.isArray(epData) ? epData : [epData];
	for (const ep of eps) {
		const epNum = Number(ep.index);
		if (!episodeKeyMap.has(season)) {
			episodeKeyMap.set(season, new Map());
		}
		const map = episodeKeyMap.get(season)!;
		map.set(epNum, ep.ratingKey);
	}
}

type UpdateSeasonRequest = {
	title: string;
};

type UpdateEpRequest = UpdateSeasonRequest & {
	summary: string;
};

const updateMap = new Map<string, UpdateSeasonRequest | UpdateEpRequest>();
for (const [season, seasonKey] of seasonKeyMap.entries()) {
	const nfo = sMap.get(season);
	if (!nfo) {
		throw new Error(`Missing season ${season}`);
	}
	const req: UpdateSeasonRequest = {
		title: nfo.title,
	};
	updateMap.set(seasonKey, req);

	for (const [ep, epKey] of episodeKeyMap.get(season)!.entries()) {
		const seasonMap = epMap.get(season);
		if (!seasonMap) {
			throw new Error("Season Ep Map missing: " + season);
		}
		const nfo = epMap.get(season)!.get(ep);
		if (!nfo) {
			throw new Error("Missing Ep " + ep);
		}
		const req: UpdateEpRequest = {
			title: nfo.title,
			summary: nfo.plot,
		};
		updateMap.set(epKey, req);
	}
}

const seasonType = "3";
const epType = "4";

for (const [id, req] of updateMap.entries()) {
	const type = "summary" in req ? epType : seasonType;
	const params = new URLSearchParams();
	params.append("type", type);
	params.append("id", id);
	params.append("includeExternalMedia", "1");
	for (const [key, value] of Object.entries(req)) {
		params.append(key + ".value", value);
		params.append(key + ".locked", "1");
	}
	const updateRes = await fetch(
		api(`library/sections/${libKey}/all`, params),
		{
			method: "PUT",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15",
				"Content-Length": "0",
				Connection: "close",
			},
		},
	);
	console.log(id, req.title, updateRes.status);
}
