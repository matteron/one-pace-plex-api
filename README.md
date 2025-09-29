# One Pace Plex Metadata

This is an alternative way to add nice metadata to the One Pace project in Plex using the Plex api instead of the XBMCnfoTVImporter plugin.

You'll have to rerun this script every time you add new episodes, it won't automatically keeps things up to date.

Uses the data from the wonderful [OnePaceOrganizer](https://github.com/ladyisatis/OnePaceOrganizer) project.
If you want a nice and easy time (with GUI!) you should probably go with the original project.
This is for my own 'workflow' primarily.

## Instructions

### 0. Install bun
Script was built using [bun](https://bun.sh);

### 1. Clone Repo
Project includes OnePaceOrganizer as a submodule.  So in order to clone it, you should use.
```bash
git clone --recurse-submodules git@github.com:matteron/one-pace-plex-api.git
```

### 2. Project setup

Install the yaml parser dependecy with
```bash
bun i
```

Create a .env file at the root of this project with the following keys and your values.
``` bash
PLEX_URL=<Plex local or remote url>
PLEX_TOKEN=<Plex Auth Token>
PLEX_LIBRARY_KEY=<Optional to start>
PLEX_ONE_PACE_KEY=<Optional to start>
```
The plex auth token can be found with this [guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

The script will guide you through getting your library keys and one pace key if they are missing.

### 3. Run the script
```bash
bun start
```

As previously mentioned, the script will help you get your library and show keys, then will quit.
Just run the script again to update data.

### 4 (Optional) Extra Arguments
There's a few optional arguments you can pass in for different functionality.
| Argument | Operation |
| --- | --- |
| --r <path> | Rename files in <path> directory based on file's hash code. |
| --p | Set show and season posters in plex |
| --altShowPoster | Use the tvshow-alt.png poster |

### 4 (Optional). Update data and rerun
For future runs, you can update the data from OnePaceOrganizer with
```bash
bun run update
```
Then just `bun start` again.

## Notes

- The file renaming is pretty basic, it looks up data based on the file's hash code at the end. Meaning if you don't have an up to date file or missing the hash in the name, it'll skip it.
- Also, I've found some of the data is outdated after some episodes got added/removed in OnePace.  Just be attentive and do small batches and it should be fine.
- In case you're wondering, Plex is smart enough to tell if a duplicate poster is being uploaded and won't save it.  So feel free to run it as much as you like.
