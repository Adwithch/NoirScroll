const VIDSRC_BASE = "https://vidsrc-embed.ru";
const PROXY_BASE = "/api/vidsrc";

export const getMovieEmbedUrl = (id: string | number, isImdb = false) => {
  const param = isImdb ? `imdb=${id}` : `tmdb=${id}`;
  return `${VIDSRC_BASE}/embed/movie?${param}&autoplay=1`;
};

export const getTVShowEmbedUrl = (id: string | number, isImdb = false) => {
  const param = isImdb ? `imdb=${id}` : `tmdb=${id}`;
  return `${VIDSRC_BASE}/embed/tv?${param}`;
};

export const getEpisodeEmbedUrl = (id: string | number, season: number, episode: number, isImdb = false) => {
  const param = isImdb ? `imdb=${id}` : `tmdb=${id}`;
  return `${VIDSRC_BASE}/embed/tv?${param}&season=${season}&episode=${episode}&autoplay=1&autonext=1`;
};

export const getLatestMovies = async (page = 1) => {
  const res = await fetch(`${PROXY_BASE}/movies/latest/page-${page}.json`);
  return res.json();
};

export const getLatestTVShows = async (page = 1) => {
  const res = await fetch(`${PROXY_BASE}/tvshows/latest/page-${page}.json`);
  return res.json();
};

export const getLatestEpisodes = async (page = 1) => {
  const res = await fetch(`${PROXY_BASE}/episodes/latest/page-${page}.json`);
  return res.json();
};
