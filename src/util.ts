import type {
  ApiBuilder,
  PlexMediaContainer,
  PlexMetadataResponse,
} from "./types";

export const acceptJson = {
  Accept: "application/json",
};

export const buildMetadataFetch = (api: ApiBuilder) => {
  return async <T>(endpoint: string): Promise<T[]> => {
    const fetchRes = await fetch(api(endpoint), {
      headers: acceptJson,
    });
    const json = (await fetchRes.json()) as PlexMetadataResponse<T>;
    const data = json.MediaContainer.Metadata;
    return Array.isArray(data) ? data : [data];
  };
};

export async function keyWizard(api: ApiBuilder) {
  type Library = {
    key: string;
    type: string;
    title: string;
  };
  const test = await fetch(api("library/sections"), {
    headers: acceptJson,
  });
  console.log(test.status);
  const libraries: Library[] = (
    (await (
      await fetch(api("library/sections"), {
        headers: acceptJson,
      })
    ).json()) as PlexMediaContainer<any>
  ).MediaContainer.Directory.sort((a: Library, b: Library) =>
    a.key.localeCompare(b.key),
  );

  let foundLibKey = "";

  while (!foundLibKey) {
    console.log("\tKey | Library");
    console.log("\t--- | -----");
    for (const lib of libraries) {
      console.log(`\t${lib.key.padStart(3)} | ${lib.title} (${lib.type})`);
    }
    const entered = prompt("Enter Library Key: ");
    const found = libraries.find((l) => l.key === entered);
    if (found) {
      foundLibKey = found.key;
    }
  }

  type Show = {
    title: string;
    ratingKey: string;
  };

  const fetcher = buildMetadataFetch(api);
  const shows = await fetcher<Show>(`library/sections/${foundLibKey}/all`);

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
      foundShowKey = searchResult[0]!.ratingKey;
    }
  }

  console.log("\nPlease copy the following to your .env file then rerun:\n");
  console.log(`PLEX_LIBRARY_KEY=${foundLibKey}`);
  console.log(`PLEX_ONE_PACE_KEY=${foundShowKey}`);
}
