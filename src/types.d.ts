export type ApiBuilder = (endpoint: string, params?: URLSearchParams) => string;

export type TvShowYaml = {
  title: string;
  sorttitle: string;
  originaltitle: string;
  premiered: string;
  releasedate: string;
  season: number;
  episode: number;
  status: string;
  year: number;
  plot: string;
  lockdata: boolean;
  rating: string;
};

type SeasonYaml = {
  saga: string;
  title: string;
  description: string;
};

type AllSeasonsYaml = {
  [num: string]: SeasonYaml;
};

export type EpisodeYaml = {
  season: number;
  episode: number;
  title: string;
  sorttile: string;
  description: string;
  manga_chapters: string;
  anime_episodes: string;
  released: string;
  hashes: {
    crc32: string;
  };
};

export type ReferenceYaml = {
  reference: string;
};

export type PlexMediaContainer<T> = {
  MediaContainer: T;
};

export type PlexMetadataResponse<T> = PlexMediaContainer<{
  Metadata: T[] | T;
}>;

type ShowPlexType = "show";
type SeasonPlexType = "season";
type EpisodePlexType = "episode";

export type PlexData = {
  index: number;
  title: string;
  ratingKey: string;
  summary: string;
};

export type ShowData = {
  type: ShowPlexType;
  originallyAvailableAt?: string;
};

export type SeasonData = {
  type: SeasonPlexType;
};

export type EpisodeData = {
  type: EpisodePlexType;
};

export type SpecificData = ShowData | SeasonPLexData | EpisodeData;

export type ShowPlexData = PlexData & ShowData;
export type SeasonPLexData = PlexData & SeasonData;
export type EpisodePlexData = PlexData & EpisodeData;

export type AnyPlexData = PlexData & SpecificData;

export type UpdateData = {
  logTitle: string;
  id: string;
  title?: string;
  summary?: string;
} & SpecificData;

export type LoadPoster = () => Promise<Uint8Array>;
export type UpdatePoster = {
  logTitle: string;
  id: string;
  poster: LoadPoster;
};
