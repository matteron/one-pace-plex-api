export type ApiBuilder = (endpoint: string, params?: URLSearchParams) => string;

export type SeasonNfoFile = {
	title: string;
	seasonnumber: number;
};

export type EpisodeNfoFile = {
	title: string;
	season: number;
	episode: number;
	plot: string;
	premiered: string;
};

export type NfoData = {
	seasons: Map<number, SeasonNfoFile>;
	episodes: Map<number, Map<number, EpisodeNfoFile>>;
};

export type PlexMediaContainer<T> = {
	MediaContainer: T;
};

export type PlexMetadataResponse<T> = PlexMediaContainer<{
	Metadata: T[] | T;
}>;

export type SeasonPlexData = {
	index: string;
	ratingKey: string;
	title: string;
	summary: string;
};

export type EpisodePlexData = {
	title: string;
	summary: string;
	ratingKey: string;
	index: string;
};

type SeasonPlexType = "3";
type EpisodePlexType = "4";

export type PlexMediaTypes = {
	season: SeasonPlexType;
	episode: EpisodePlexType;
};

export type UpdateData = {
	id: string;
	title: string;
} & (
	| {
			type: SeasonPlexType;
	  }
	| {
			type: EpisodePlexType;
			summary: string;
	  }
);
