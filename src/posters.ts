import { readdir, lstat } from "node:fs/promises";
import path from "node:path";
import type { LoadPoster } from "./types";

type Posters = {
  tvshow: LoadPoster;
  seasons: LoadPoster[];
};

const posterRegex = /poster-season(\d*).png/;

export async function findPosters(
  subModulePath: string,
  useAltShowPoster: boolean,
): Promise<Posters> {
  const posterPath = path.join(subModulePath, "data/posters/");
  const files = await readdir(posterPath);
  const res: Partial<Posters> = {
    seasons: [],
  };
  for (const file of files) {
    const fullPath = path.join(posterPath, file);
    const stats = await lstat(fullPath);
    if (!stats.isFile()) {
      continue;
    }
    const loader: LoadPoster = async () => await Bun.file(fullPath).bytes();
    const match = posterRegex.exec(file);
    if (match) {
      const season = +match[1];
      res.seasons![season] = loader;
    } else {
      if (
        (useAltShowPoster && file.includes("alt")) ||
        (!useAltShowPoster && !file.includes("alt"))
      ) {
        res.tvshow = loader;
      }
    }
  }
  if (!res.tvshow) {
    console.error("Unable to find suitable show poster!");
    process.exit();
  }
  return res as Posters;
}
