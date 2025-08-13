import { plexData } from "./src/plex";
import { renameEpisodes } from "./src/rename";
import { parseArgs } from "util";

const subModuleRegex = /path = (.*)\n/;

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    r: {
      type: "string",
    },
    p: {
      type: "boolean",
    },
    altShowPoster: {
      type: "boolean",
    },
  },
  strict: true,
  allowPositionals: true,
});

const gitModules = await Bun.file(".gitmodules").text();
const subModuleMatch = subModuleRegex.exec(gitModules);
if (!subModuleMatch) {
  console.error("Could not match OnePaceOrganizer in gitsubmodule");
  process.exit();
}

const subModulePath = subModuleMatch[1];
if (!subModulePath) {
  console.error("Sub module path empty.");
  process.exit();
}

if (values.r) {
  renameEpisodes(subModulePath, values.r);
} else {
  plexData(subModulePath, values.p ?? false, values.altShowPoster ?? false);
}
