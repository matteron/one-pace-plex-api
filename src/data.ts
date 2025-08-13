import type {
  AllSeasonsYaml,
  EpisodeYaml,
  ReferenceYaml,
  SeasonYaml,
  TvShowYaml,
} from "./types";
import { parse } from "yaml";
import { readdir } from "node:fs/promises";
import path from "node:path";

type YamlData = {
  show: TvShowYaml;
  seasons: {
    [season: number]: {
      season: SeasonYaml;
      episodes: {
        [ep: number]: EpisodeYaml;
      };
    };
  };
};
export async function loadData(subModulePath: string): Promise<YamlData> {
  const dataPath = path.join(subModulePath, "data/");
  const show = parse(
    await Bun.file(path.join(dataPath, "tvshow.yml")).text(),
  ) as TvShowYaml;

  const seasons = parse(
    await Bun.file(path.join(dataPath, "seasons.yml")).text(),
  ) as AllSeasonsYaml;

  const epDir = path.join(dataPath, "episodes/");
  const eps = await readdir(epDir);

  const res: YamlData = {
    show,
    seasons: {},
  };

  for (const epPath of eps) {
    if (!epPath.endsWith(".yml")) {
      continue;
    }
    const ep = parse(
      await Bun.file(path.join(epDir, epPath)).text(),
    ) as EpisodeYaml;

    if (!ep.season) {
      continue;
    }

    if (res.seasons[ep.season]) {
      res.seasons[ep.season]!.episodes[ep.episode] = ep;
    } else {
      res.seasons[ep.season] = {
        season: seasons[ep.season + ""]!,
        episodes: [ep],
      };
    }
  }
  return res;
}

type EpisodesByHash = {
  [hash: string]: EpisodeYaml;
};
export async function loadEpisodesByHash(
  subModulePath: string,
): Promise<EpisodesByHash> {
  const epDir = path.join(subModulePath, "/data/episodes/");
  const eps = await readdir(epDir);

  const res: EpisodesByHash = {};
  const refs: {
    hash: string;
    reference: string;
  }[] = [];
  for (const epPath of eps) {
    if (!epPath.endsWith(".yml")) {
      continue;
    }
    const ep = parse(await Bun.file(path.join(epDir, epPath)).text()) as
      | EpisodeYaml
      | ReferenceYaml;

    if ("reference" in ep) {
      refs.push({
        hash: epPath.split(".yml")[0]!,
        reference: ep.reference,
      });
      continue;
    }

    if (!ep.hashes || !ep.hashes.crc32) {
      continue;
    }

    res[ep.hashes.crc32] = ep;
  }

  for (const { hash, reference } of refs) {
    const data = res[reference];
    if (data) {
      res[hash] = data;
    }
  }

  return res;
}
