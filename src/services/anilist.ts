import { Manga, PageInfo } from "../types";

const PROXY_URL = "/api/anilist";

const query = `
query ($page: Int, $perPage: Int, $search: String, $type: MediaType, $format: [MediaFormat], $tag: String, $genre: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (search: $search, type: $type, format_in: $format, tag: $tag, genre: $genre, sort: [TRENDING_DESC, POPULARITY_DESC]) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      description
      status
      format
      chapters
      averageScore
      startDate {
        year
        month
        day
      }
      genres
    }
  }
}
`;

export const fetchAniListManga = async (params: {
  page?: number;
  perPage?: number;
  search?: string;
  format?: string[];
  tag?: string;
  genre?: string;
}): Promise<{ manga: Manga[]; pageInfo: PageInfo }> => {
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        page: params.page || 1,
        perPage: params.perPage || 20,
        search: params.search,
        type: "MANGA",
        format: params.format || ["MANGA", "ONE_SHOT"],
        tag: params.tag,
        genre: params.genre,
      },
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    console.error("AniList API errors:", JSON.stringify(data.errors, null, 2));
    throw new Error(data.errors[0].message || "Failed to fetch from AniList");
  }

  if (!data.data || !data.data.Page) {
    console.error("AniList API returned no data:", data);
    return { manga: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 } };
  }

  const pageData = data.data.Page;

  const manga: Manga[] = pageData.media.map((item: any) => ({
    id: item.id,
    anilistId: item.id,
    title: item.title.english || item.title.romaji || item.title.native,
    coverImage: item.coverImage.extraLarge || item.coverImage.large,
    bannerImage: item.bannerImage,
    description: item.description,
    genres: item.genres,
    status: item.status,
    format: item.format,
    chapters: item.chapters,
    averageScore: item.averageScore,
    startDate: item.startDate.year ? `${item.startDate.year}-${item.startDate.month}-${item.startDate.day}` : undefined,
    type: item.format === "MANGA" ? "MANGA" : "WEBTOON", // Simplified
  }));

  return {
    manga,
    pageInfo: pageData.pageInfo,
  };
};

export const getMangaDetails = async (id: number): Promise<Manga> => {
  const detailQuery = `
  query ($id: Int) {
    Media (id: $id) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
      }
      bannerImage
      description
      status
      format
      chapters
      averageScore
      genres
      startDate {
        year
        month
        day
      }
    }
  }
  `;

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: detailQuery,
      variables: { id },
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    console.error("AniList API errors:", JSON.stringify(data.errors, null, 2));
    throw new Error(data.errors[0].message || "Failed to fetch manga details");
  }

  if (!data.data || !data.data.Media) {
    throw new Error("Manga not found");
  }

  const item = data.data.Media;

  return {
    id: item.id,
    anilistId: item.id,
    title: item.title.english || item.title.romaji || item.title.native,
    coverImage: item.coverImage.extraLarge,
    bannerImage: item.bannerImage,
    description: item.description,
    genres: item.genres,
    status: item.status,
    format: item.format,
    chapters: item.chapters,
    averageScore: item.averageScore,
    startDate: item.startDate.year ? `${item.startDate.year}-${item.startDate.month}-${item.startDate.day}` : undefined,
    type: item.format === "MANGA" ? "MANGA" : "WEBTOON",
  };
};
