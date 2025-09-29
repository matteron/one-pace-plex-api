# One Pace Plex Metadata

This is an alternative way to add nice metadata to the One Pace project in Plex using the Plex api instead of the XBMCnfoTVImporter plugin.

You'll have to rerun this script every time you add new episodes, it won't automatically keeps things up to date.

Uses the data from the wonderful [OnePaceOrganizer](https://github.com/ladyisatis/OnePaceOrganizer) project.
If you want a nice and easy time (with GUI!) you should probably go with the original project.

This script is for my own 'workflow' really.

## Instructions

### 0. Install bun and clone repo
Script was built using [bun](https://bun.sh);

### 1. Project setup
Create a `.env` file at the root of this project with the following keys and your values.
``` bash
PLEX_URL=<Plex local or remote url>
PLEX_TOKEN=<Plex Auth Token>
PLEX_LIBRARY_KEY=<Optional to start>
PLEX_ONE_PACE_KEY=<Optional to start>
DATA_REPO=<Optional github repository for data>
```
The plex auth token can be found with this [guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

The script will guide you through getting `PLEX_LIBRARY_KEY` and `PLEX_ONE_PACE_KEY` if they are missing from the `.env` File.

The `DATA_REPO` is the github repository in case you want to use a fork of the project for metadata.
Default value is `ladyisatis/OnePaceOrganizer`.

### 3. Run the script
```bash
bun start
```

As previously mentioned, the script will help you get your library and show keys, then will quit.
Just run the script again to update data.

### Arguments
There's a few optional arguments you can pass in for different functionality.
| Argument | Operation |
| --- | --- |
| -r "path" | Rename files in "path" directory based on file's hash code. |
| -p | Set show and season posters in plex |

## Notes

- The file renaming is pretty basic, it looks up data based on the file's hash code at the end. Meaning if you don't have an up to date file or missing the hash in the name, it'll skip it.
- Also, I've found some of the data is outdated after some episodes got added/removed in OnePace.  Just be attentive and do small batches and it should be fine.
- In case you're wondering, Plex is smart enough to tell if a duplicate poster is being uploaded and won't save it.  So feel free to run it as much as you like.
