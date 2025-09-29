import type {
  EpisodePlexData,
  ApiBuilder,
  SeasonPLexData,
  ShowPlexData,
  UpdateData,
  AnyPlexData,
  UpdatePoster,
  OnePaceOrganizerData,
} from "./types";
import { buildMetadataFetch, data_endpoint_builder, keyWizard } from "./util";

export async function plexData(includePosters: boolean) {
  const url = process.env.PLEX_URL;
  if (!url) {
    console.error("Missing PLEX_URL environment variable.");
    process.exit();
  }

  const token = process.env.PLEX_TOKEN;
  if (!token) {
    console.error("Missing PLEX_TOKEN environment variable.");
    process.exit();
  }

  const api: ApiBuilder = (endpoint, params) => {
    return `${url}/${endpoint}?${!!params ? params.toString() + "&" : ""}X-Plex-Token=${token}`;
  };

  const libKey = process.env.PLEX_LIBRARY_KEY;
  const showKey = process.env.PLEX_ONE_PACE_KEY;
  if (!libKey || !showKey) {
    await keyWizard(api);
    return;
  }

  const data_endpoint = data_endpoint_builder();

  const data: OnePaceOrganizerData = await (
    await fetch(data_endpoint("raw/refs/heads/main/metadata/data.min.json"))
  ).json();

  console.log("\x1b[33mGathering changes...\x1b[0m");

  const metaFetch = buildMetadataFetch(api);

  const toUpdate: UpdateData[] = [];
  const toPoster: UpdatePoster[] = [];

  const show = (
    await metaFetch<ShowPlexData>(`library/metadata/${showKey}`)
  )[0];
  if (!show) {
    console.error("Could not find One Pace.");
    process.exit();
  }

  const updateShow = determineUpdate(show, data.tvshow, "originaltitle", [
    ["title", "originaltitle"],
    ["summary", "plot"],
    ["originallyAvailableAt", "releasedate"],
  ]);

  if (updateShow) {
    toUpdate.push(updateShow);
  }

  const poster_endpoint = (png: string) => {
    return data_endpoint(
      `/blob/main/${png}`,
      new URLSearchParams([["raw", "true"]]),
    );
  };

  if (includePosters) {
    toPoster.push({
      logTitle: data.tvshow.title + " (Poster)",
      id: show.ratingKey,
      poster: poster_endpoint("posters/poster.png"),
    });
  }

  const seasons = await metaFetch<SeasonPLexData>(
    `library/metadata/${showKey}/children`,
  );

  for (const season of seasons) {
    const info = data.arcs[season.index];
    if (!info) {
      continue;
    }
    const sLogTitle = `S${season.index} - ${info.title}`;
    const updateSeason = determineUpdate(
      season,
      {
        logTitle: sLogTitle,
        title: info.title + ` (${season.index})`,
        summary: info.saga + "\n\n" + info.description,
      },
      "logTitle",
      [
        ["title", "title"],
        ["summary", "summary"],
      ],
    );
    if (updateSeason) {
      toUpdate.push(updateSeason);
    }
    if (includePosters) {
      toPoster.push({
        logTitle: sLogTitle + " (Poster)",
        id: season.ratingKey,
        // poster: poster_endpoint(info.poster),
        poster: poster_endpoint(`posters/${info.part}/poster.png`),
      });
    }
    const episodes = await metaFetch<EpisodePlexData>(
      `library/metadata/${season.ratingKey}/children`,
    );
    for (const episode of episodes) {
      const epIndex = episode.index
        .toString()
        .padStart(2, "0") as keyof (typeof data)["arcs"][number]["episodes"];
      const epHashes = info.episodes[epIndex];
      if (!epHashes) {
        continue;
      }
      const crc32 = epHashes.crc32 as keyof (typeof data)["episodes"];
      const epInfo = data.episodes[crc32];
      if (!epInfo) {
        continue;
      }
      const updateEpisode = determineUpdate(
        episode,
        {
          logTitle: `S${epInfo.arc}E${epInfo.episode} - ${epInfo.title}`,
          title: epInfo.title,
          summary:
            epInfo.description +
            `\n\nManga Chapter${pluralize(epInfo.chapters)}: ` +
            epInfo.chapters +
            `\n\nAnime Episode${pluralize(epInfo.episodes)}: ` +
            epInfo.episodes,
        },
        "logTitle",
        [
          ["title", "title"],
          ["summary", "summary"],
        ],
      );
      if (updateEpisode) {
        toUpdate.push(updateEpisode);
      }
    }
  }
  if (
    !toUpdate.length &&
    (!includePosters || (includePosters && !toPoster.length))
  ) {
    console.log("\x1b[34mNothing found to update!\x1b[0m");
    process.exit();
  }

  const pendingCount: ResultCount = {
    ...baseCount,
  };
  for (const pending of toUpdate) {
    pendingCount[pending.type] += 1;
  }
  if (includePosters) {
    for (const pending of toPoster) {
      pendingCount.poster += 1;
    }
  }

  let shouldContinue: "y" | "n" | undefined;
  while (!shouldContinue) {
    const maxCount = Math.max(
      pendingCount.show,
      pendingCount.season,
      pendingCount.episode,
      includePosters ? pendingCount.poster : 0,
    );
    const maxLen = (maxCount + "").length;

    const epTitle = "Episodes...";
    const epLen = epTitle.length;
    console.log("About to update data for:");

    const format = (text: string, number: number) => {
      const blue = "\x1b[34m";
      const green = "\x1b[32m";
      const end = "\x1b[0m";
      const numText = number + "";
      const dots = epLen - text.length + (maxLen - numText.length);
      return `${blue}${text}${end}${"".padEnd(dots, ".")}${green}${numText}${end}`;
    };

    console.log(format("Show", pendingCount.show));
    console.log(format("Seasons", pendingCount.season));
    console.log(format("Episodes", pendingCount.episode));
    if (includePosters) {
      console.log(format("Posters", pendingCount.poster));
    }
    const yn = prompt("Looks good to send to plex? (y|N)");
    if (!yn) {
      shouldContinue = "n";
    } else if (yn === "y" || yn === "n") {
      shouldContinue = yn;
    }
  }

  if (shouldContinue === "n") {
    console.log("¯\\_(ツ)_/¯");
    process.exit();
  }

  let results: Results = {
    success: { ...baseCount },
    error: { ...baseCount },
  };
  for (const { id, type, logTitle, ...fields } of toUpdate) {
    const params = new URLSearchParams();
    params.append("type", typeMap[type] + "");
    params.append("id", id);
    params.append("includeExternalMedia", "1");
    for (const [key, value] of Object.entries(fields)) {
      if (!value) {
        continue;
      }
      params.append(key + ".value", value + "");
      params.append(key + ".locked", "1");
    }
    const updateRes = await fetch(
      api(`library/sections/${libKey}/all`, params),
      {
        method: "PUT",
      },
    );
    results = logResult(updateRes, type, logTitle, results);
  }

  for (const { id, poster, logTitle } of toPoster) {
    const updateRes = await fetch(
      api(
        `/library/metadata/${id}/posters`,
        new URLSearchParams([["url", poster]]),
      ),
      {
        method: "POST",
      },
    );
    results = logResult(updateRes, "poster", logTitle, results);
  }

  const showLen = "Show".length;
  const sLen = "Seasons".length;
  const eLen = "Episodes".length;
  const pLen = "Posters".length;
  console.log("\n Results | Show | Seasons | Episodes | Posters");
  const formatOutput = (code: string, count: ResultCount) =>
    ` ${code}| ${(count.show + "").padStart(showLen)} | ${(count.season + "").padStart(sLen)} | ${(count.episode + "").padStart(eLen)} | ${(count.poster + "").padStart(pLen)}`;

  console.log(formatOutput(logCodes.ok, results.success));
  console.log(formatOutput(logCodes.fail, results.error));
}

type StringKey<T> = {
  [key in keyof T]: T[key] extends string | undefined ? key : never;
}[keyof T];

type PlexDataSpecific<Type extends AnyPlexData["type"]> =
  AnyPlexData["type"] extends Type ? AnyPlexData : never;

function determineUpdate<
  T extends AnyPlexData,
  S extends Record<string, any>,
  KT extends StringKey<T> & StringKey<UpdateData & { type: T["type"] }>,
  KS extends StringKey<S>,
  KLT extends KS,
  Keys extends [KT, KS][],
>(target: T, source: S, logTitleKey: KLT, keys: Keys): UpdateData | undefined {
  const res: Partial<UpdateData> = {
    id: target.ratingKey,
    type: target.type,
    logTitle: source[logTitleKey],
  };
  for (const [kt, ks] of keys) {
    res[kt as keyof UpdateData] =
      (target[kt] as string) === source[ks] ? undefined : source[ks];
  }

  return keys.some(([kt]) => !!res[kt as keyof UpdateData])
    ? (res as UpdateData)
    : undefined;
}

function pluralize(range: string | number): string {
  if (typeof range === "number" || !range.includes("-")) {
    return "";
  }
  return "s";
}

type ResultCount = { [key in UpdateData["type"] | "poster"]: number };
const baseCount: ResultCount = {
  show: 0,
  season: 0,
  episode: 0,
  poster: 0,
};
type Results = {
  success: ResultCount;
  error: ResultCount;
};

const typeMap: Record<UpdateData["type"], number> = {
  show: 2,
  season: 3,
  episode: 4,
};

const logCodes = {
  ok: "\x1b[32m [ OK ] \x1b[0m",
  fail: "\x1b[31m [FAIL] \x1b[0m",
};
function logResult(
  res: Response,
  type: keyof ResultCount,
  title: string,
  results: Results,
) {
  const {
    resBucketKey,
    logCode,
  }: { resBucketKey: keyof Results; logCode: string } =
    res.status === 200
      ? {
          resBucketKey: "success",
          logCode: logCodes.ok,
        }
      : {
          resBucketKey: "error",
          logCode: logCodes.fail,
        };

  console.log(`${logCode}${title}`);
  results[resBucketKey][type] += 1;
  return results;
}
