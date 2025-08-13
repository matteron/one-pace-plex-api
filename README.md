# One Pace Plex Metadata

This is an alternative way to add nice metadata to the One Pace project in Plex using the Plex api instead of the XBMCnfoTVImporter plugin.

You'll have to rerun this script every time you add new episodes, it won't automatically keeps things up to date.

Uses the data extracted by the [OnePaceOrganizer](https://github.com/ladyisatis/OnePaceOrganizer) project.

## Instructions

### 0. Install a Javascript runtime

Script was built using [bun](https://bun.sh);

### 1. Project setup

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

### 2. Download and Rename One Pace Files

Follow the [install instructions](https://github.com/SpykerNZ/one-pace-for-plex/tree/main#install-instructions) from the original repo up to step 5.

### 3. Run the script
```bash
bun start
```
or
```bash
npm start
```

### 4. Posters and tvshow.nfo
This script doesn't handle posters in any way, so you'll need to go ahead and add those yourself.
