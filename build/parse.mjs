import fs from "fs";
import { parse } from "yaml";
import { Converter } from "showdown";

const POST_DIR = "./posts";
const CONVERTER = new Converter();

/**
 * @typedef {{
 *    layout: "book";
 *    id: string;
 *    title: string; 
 *    subtitle?: string; 
 *    author: string;
 *    date?: Date;
 *    pageCount?: number;
 *    written?: number;
 *    stars?: number;
 *    tags?: string[];
 *    mapping?: string[];
 *    gender?: "m" | "f";
 *    translatedFrom?: string;
 *  }} BookInfo
 * @typedef {{
 *    layout: "book" | "post";
 *    title?: string;
 *    subtitle?: string;
 *    author?: string; 
 *    date?: string; 
 *    pageCount?: number; 
 *    written?: number; 
 *    stars?: number; 
 *    tags?: string; 
 *    mapping?: string; 
 *    gender?: "m" | "f";
 *    translatedFrom?: string;
 * }} RawBookInfo
 * 
 * @typedef {{layout: "location"; id: string; latitude: number; longitude: number;}} LocationInfo
 * @typedef {{layout: "author"; id: string; name: string; gender?: "m" | "f"; mapping?: string;}} AuthorInfo
 * @typedef {{layout: "tag"; id: string; }} TagInfo
 * @typedef {BookInfo | LocationInfo | AuthorInfo | TagInfo} PostInfo
 */

/**
 * @param {string} mapping Flat mapping string used for in-markdown-representation
 * @returns {string[]} Mapping location unpacked for regular data analysis
 */
function unpackMap(mapping) {
  const mapParts = mapping?.split(", ");
  if (mapParts) {
    return [...mapParts].map((_, i) => mapParts.slice(i).join(", "));
  }
  return []
}
/**
 * @param {string[]} mapping Mapping location unpacked for regular data analysis
 * @returns {string} Flat mapping string used for in-markdown-representation
 */
function packMap(mapping) {
  return mapping?.[0]?.split(", ");
}

/** @typedef {{file: {header: Object, content: string}, data?: PostInfo}} Post*/
/**
 * 
 * @param {*} dir 
 * @param {*} file 
 * @returns {Post}
 */
function parsePost(dir, file) {
  let content = "";
  const fileContent = fs.readFileSync(`${dir}/${file}`, "utf-8");
  let yamlContent = "";
  let state = 0;
  for (const line of fileContent.split("\n")) {
    if (line === "---") {
      state += 1;
      continue;
    }
    if (state === 1) {
      yamlContent += `${line}\n`;
    } else {
      content += line;
    }
  }
  /** @type Object */
  const header = parse(yamlContent);
  /** @type {PostInfo} */
  const data = { ...header };
  data.review = content ? CONVERTER.makeHtml(content) : "";
  data.tags = header.tags?.split(" ") ?? [];
  data.file = file;
  if (header.layout === "post" || header.layout === "book") {
    const [year, month, day, ...title] = filename.split("-");
    data.title = " ".join(title).slice(0, -3);
    data.readOn = `${year}-${month}-${day}`;
    if(book.mapping) {
      data.mapping = unpackMap(book.mapping);
    }
    const mapParts = book.mapping?.split(", ");
    if (mapParts) {
      data.mapping = [...mapParts].map((_, i) => mapParts.slice(i).join(", "));
    }
  }
  return { file: { header, content }, data };
}
export function parsePosts() {
  const dir = fs.readdirSync(POST_DIR);
  const posts = {
    authors: {},
    books: {},
    locations: {},
    tags: {},
    languages: {},
  };

  for (const ent of dir) {
    const  = parsePost(POST_DIR, ent);
  }
}
