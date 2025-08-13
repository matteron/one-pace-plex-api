import { plexData } from "./src/plex";
import { renameEpisodes } from "./src/rename";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    r: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

if (values.r) {
  renameEpisodes(values.r);
} else {
  plexData();
}
