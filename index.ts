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
  },
  strict: true,
  allowPositionals: true,
});

if (values.r) {
  renameEpisodes(values.r);
} else {
  plexData(values.p ?? false);
}
