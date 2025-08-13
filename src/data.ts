import type {
  AllSeasonsYaml,
  EpisodeYaml,
  ReferenceYaml,
  SeasonYaml,
  TvShowYaml,
} from "./types";
import { parse } from "yaml";
import { readdir } from "node:fs/promises";

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
export async function loadData(): Promise<YamlData> {
  const show = parse(
    await Bun.file("./OnePaceOrganizer/data/tvshow.yml").text(),
  ) as TvShowYaml;

  const seasons = parse(
    await Bun.file("./OnePaceOrganizer/data/seasons.yml").text(),
  ) as AllSeasonsYaml;

  const eps = await readdir("./OnePaceOrganizer/data/episodes/");

  const res: YamlData = {
    show,
    seasons: {},
  };

  for (const path of eps) {
    if (!path.endsWith(".yml")) {
      continue;
    }
    const ep = parse(
      await Bun.file("./OnePaceOrganizer/data/episodes/" + path).text(),
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
export async function loadEpisodesByHash(): Promise<EpisodesByHash> {
  const eps = await readdir("./OnePaceOrganizer/data/episodes/");

  const res: EpisodesByHash = {};
  const refs: {
    hash: string;
    reference: string;
  }[] = [];
  for (const path of eps) {
    if (!path.endsWith(".yml")) {
      continue;
    }
    const ep = parse(
      await Bun.file("./OnePaceOrganizer/data/episodes/" + path).text(),
    ) as EpisodeYaml | ReferenceYaml;

    if ("reference" in ep) {
      refs.push({
        hash: path.split(".yml")[0]!,
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
