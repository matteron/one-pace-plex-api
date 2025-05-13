# One Pace Plex Metadata

This is an alternative way to add nice metadata to the One Pace project in Plex using the Plex api instead of the XBMCnfoTVImporter plugin.

It uses the .nfo data from SpykerNZ's excellent [one-pace-for-plex](https://github.com/SpykerNZ/one-pace-for-plex?tab=readme-ov-file) repository.

You'll have to rerun this script every time you add new episodes, it won't automatically keeps things up to date.

Also, please understand, this was written at 1 am.  The code ain't great.

## Instructions

### 1. Install Bun

[Follow the instruction to install bun](https://bun.sh)

### 2. Project setup

- Install the xml parser dependecy with
```
bun Install
```

- Copy the folders inside the [`One Pace` folder](https://github.com/SpykerNZ/one-pace-for-plex/tree/main/One%20Pace) from SpykerNZ's repo to `./data` folder.

- Create a .env file at the root of this project with the following keys.
``` bash
PLEX_URL=<Plex local or remote url>
PLEX_TOKEN=<Plex Auth Token>
PLEX_LIBRARY_KEY=<Optional>
PLEX_ONE_PACE_KEY=<Optional>
```
The plex auth token can be found with this [guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

The script will guide you through getting your library keys and one pace key if they are missing.

### 3. Download and Rename One Pace Files

Follow the [install instructions](https://github.com/SpykerNZ/one-pace-for-plex/tree/main#install-instructions) from the original repo up to step 5.

### 4. Run the script
```
bun run start
```

### 5. Posters and tvshow.nfo
This script doesn't handle posters in any way, so you'll need to go ahead and add those yourself.

Additionally, it doesn't deal with the root tvshow.nfo file, so it won't add the summary and title to the show itself.
You only have to do this once, so you can just open up the file and copy paste the data in there to the two appropriate fields in plex directly.
