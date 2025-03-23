import fs from "fs";
import path from "path";

import { parse } from "yaml";
import showdown from "showdown";

import { locate } from "./locate.mjs";

const CONTENT_DIR = "./content";

const CONVERTER = new showdown.Converter();

/**
 * @typedef {{layout: string; id: string; name?: string; tags?: string[]; content?: string; contentHtml?: string}} GenericPost
 * @typedef {GenericPost & {layout: "tag"; specialization?: "language" | "series" }} TagInfo
 * @typedef {GenericPost & {layout: "location"; latitude: number; longitude: number;}} LocationInfo
 * @typedef {GenericPost & {layout: "author";  gender?: "m" | "f"; mapping?: string[];}} AuthorInfo

* @typedef {Omit<AuthorInfo, "layout"> & {
 *    layout: "book";
 *    subtitle?: string;
 *    author: string;
 *    authorId: string;
 *    date: string;
 *    previouslyRead?: string[];
 *    pageCount?: number;
 *    written?: number;
 *    stars?: number;
 *    mapping?: string[];
 *    gender?: "m" | "f";
 *    translatedFrom?: string;
 *    series?: string;
 *    content?: string;
 *    contentHtml?: string;
 * }} BookInfo
 * @typedef {{
 *    layout: "book" | "post";
 *    title?: string;
 *    subtitle?: string;
 *    author?: string;
 *    date: string;
 *    pageCount?: number;
 *    written?: number;
 *    stars?: number;
 *    tags?: string;
 *    mapping?: string;
 *    gender?: "m" | "f";
 *    translatedFrom?: string;
 *    series?: string;
 * }} RawBookInfo
 *
 * @typedef {BookInfo | LocationInfo | AuthorInfo | TagInfo} PostInfo
 */

/**
 * @param {string | null | undefined} str string to slugify
 * @returns {string} slug like `A-Clockwork-Orange` for URLs and ids
 */
function slugify(str) {
  if (!str) {
    return "-";
  }
  return str
    .replaceAll(" ", "-")
    .replaceAll(/[^a-zA-Z0-9\-]/g, "")
    .replaceAll("--", "-");
}

/**
 * @param {string} mapping Flat mapping string used for in-markdown-representation, e.g. New York, USA, North America
 * @returns {string[]} Mapping location unpacked for regular data analysis
 */
function unpackMap(mapping) {
  const mapParts = mapping?.split(", ");
  if (mapParts) {
    return [...mapParts].map((_, i) => mapParts.slice(i).join(", "));
  }
  return [];
}
/**
 * @param {string[]} mapping Mapping location unpacked for regular data analysis
 * @returns {string} Flat mapping string used for in-markdown-representation
 */
function packMap(mapping) {
  return mapping?.[0]?.split(", ");
}

/**
 *
 * @param {*} dir
 * @param {*} filename
 * @returns {PostInfo}
 */
function parsePost(dir, filename) {
  let content = "";
  const fileContent = fs.readFileSync(`${dir}/${filename}`, "utf-8");
  let yamlContent = "";
  let state = 0;
  for (const line of fileContent.split("\n")) {
    if (line === "---") {
      state += 1;
      continue;
    }
    if (state === 1) {
      yamlContent += line + "\n";
    } else {
      content += line + "\n";
    }
  }
  /** @type Object */
  const header = parse(yamlContent);
  /** @type {PostInfo} */
  const data = { ...header };
  data.content = content?.trim() ?? undefined;
  data.contentHtml = content ? CONVERTER.makeHtml(content) : undefined;
  data.filename = filename;

  if (header.tags) {
    data.tags = header.tags?.split(" ");
  }
  if (header.mapping) {
    data.mapping = unpackMap(header.mapping);
  }

  if (header.layout === "post" || header.layout === "book") {
    const [year, month, day, ...title] = path
      .basename(filename, ".md")
      .split("-");
    if (!data.name) {
      data.name = title.join(" ").trim();
      if (header.subtitle && data.name.endsWith(header.subtitle)) {
        data.name = data.name.slice(0, -header.subtitle.length).trim();
      }
    }

    data.date = `${year}-${month}-${day}`;
    if (header.layout === "post") {
      data.layout = "book";
    }
  }
  return data;
}
/**
 * Reads and parses posts from the content directory
 * @returns {PostInfo[]} po
 */
export function parsePosts() {
  return fs
    .readdirSync(CONTENT_DIR, { recursive: true })
    .flatMap((filename) =>
      filename.endsWith(".md") ? [parsePost(CONTENT_DIR, filename)] : []
    );
}

/**
 *
 * @param {PostInfo} post
 */
function assignIds(data) {
  data.id = data.id ?? slugify(data.name);
  data.layout = data.layout === "post" ? "book" : data.layout ?? "book";
  return data;
}

/**
 * @param {string} tag
 * @param {"language" | "series" | undefined} specialization
 * @returns {TagInfo} */
function createTag(tag, specialization) {
  const id = slugify(tag);
  if (id !== tag) {
    return { layout: "tag", id, name: tag, specialization };
  }
  return { layout: "tag", id: tag, specialization };
}

/**
 * @param {string} name
 * @param {"m" | "f" | undefined} gender
 * @param {string[] | undefined} mapping
 * @returns {AuthorInfo}
 */
function createAuthor(name, authorId, gender, mapping) {
  const id = authorId ?? slugify(name);
  return { layout: "author", id, name, gender, mapping };
}

function createLocation(name) {
  const id = slugify(name);
  return { layout: "location", id, name };
}

async function findLocation(location) {
  if (location.latitude == null || location.latitude == null) {
    const found = await locate(location.name);
    if (found) {
      location.latitude = found.latitude;
      location.longitude = found.longitude;
    }
  }
}

/**
 *
 * @param {PostInfo[]} posts
 * @returns {PostInfo[]} normalized post information
 */
export async function normalizePosts(rawPosts) {
  const posts = rawPosts.map(assignIds);

  /** @type {Record<PostInfo["layout"], Record<string, PostInfo>} */
  const identifiedPosts = {
    author: {},
    book: {},
    location: {},
    tag: {},
  };

  /** @param {PostInfo} post */
  const identifyPost = (post) => {
    const previous = identifiedPosts[post.layout][post.id];
    if (post.layout === "book" && previous) {
      console.warn("Overwriting book!", post.id, post.name);
      identifiedPosts[post.layout][post.id] = {
        ...post,
        previouslyRead: [previous.date, ...(previous.previouslyRead ?? [])],
      };
    } else {
      identifiedPosts[post.layout][post.id] = {
        ...previous,
        ...Object.fromEntries(
          Object.entries(post).filter(([_k, v]) => v !== undefined)
        ),
      };
    }
    return post.id;
  };

  for (const post of posts) {
    if (post.layout == null || identifiedPosts[post.layout] == null) {
      console.warn(`Invalid post`, post);
      continue;
    }
    identifyPost(post);
    const p = identifiedPosts[post.layout][post.id];
    if (p.mapping) {
      p.mapping = p.mapping.map((loc) => identifyPost(createLocation(loc)));
    }
    if (p.tags) {
      p.tags = p.tags.map((tag) => identifyPost(createTag(tag)));
    }

    if (p?.layout === "book") {
      if (p.author) {
        p.authorId = identifyPost(
          createAuthor(p.author, p.authorId, p.gender, p.mapping)
        );
      }
      if (p?.series) {
        p.series = identifyPost(createTag(p.series, "series"));
      }
      if (post?.translatedFrom) {
        identifyPost(createTag(post.translatedFrom, "language"));
      }
    }
  }
  for (const book of Object.values(identifiedPosts.book)) {
    if (
      book.mapping === undefined &&
      identifiedPosts.author[book.authorId]?.mapping
    ) {
      book.mapping = [...identifiedPosts.author[book.authorId].mapping];
    }
    if (
      book.gender === undefined &&
      identifiedPosts.author[book.authorId]?.gender
    ) {
      book.gender = identifiedPosts.author[book.authorId]?.gender;
    }
  }
  for (const location of Object.values(identifiedPosts.location)) {
    await findLocation(location);
  }
  return Object.values(identifiedPosts).flatMap((postMap) =>
    Object.values(postMap)
  );
}
