import path from "node:path";
import { readdir, rename } from "node:fs/promises";
import type { EpisodeMap, OnePaceOrganizerData } from "./types";
import { data_endpoint_builder } from "./util";

const hashRegex = /.*\[(.*)\]\./;

type Rename = {
  from: string;
  to: string;
};

export async function renameEpisodes(directory: string) {
  const files = await readdir(directory);

  const data_endpoint = data_endpoint_builder();
  const data: OnePaceOrganizerData = await (
    await fetch(data_endpoint("raw/refs/heads/main/metadata/data.min.json"))
  ).json();

  const res: Rename[] = [];
  for (const file of files) {
    const match = file.match(hashRegex);
    if (!match) {
      continue;
    }
    const hash = match[1]! as keyof EpisodeMap;
    const ep = data.episodes[hash];
    if (!ep) {
      console.log("Data not found for: " + file);
      continue;
    }
    const s = ep.arc.toString().padStart(2, "0");
    const e = ep.episode.toString().padStart(2, "0");
    const title = ep.title;
    const fileName = `One Pace - S${s}E${e} - ${title}.mkv`;
    res.push({
      from: file,
      to: fileName,
    });

    console.log(`\n ${logCodes.from} ${file}`);
    console.log(` ${logCodes.to} ${fileName}`);
  }

  if (!res.length) {
    console.log("\x1b[34mNothing found to rename!\x1b[0m");
    process.exit();
  }

  let shouldContinue: "y" | "n" | undefined;
  while (!shouldContinue) {
    const yn = prompt("Continue? (y|N)");
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

  for (const { from, to } of res) {
    await rename(path.join(directory, from), path.join(directory, to));
  }

  console.log("All Done! *｡٩(ˊωˋ*)و✧*｡");
}

const logCodes: Rename = {
  from: "\x1b[93m [FROM] \x1b[0m",
  to: "\x1b[32m [ TO ] \x1b[0m",
};
