import fs from "fs/promises";
import path from "path";

import { normalizePosts, parsePosts } from "./parse.mjs";
import { ROUTES } from "../src/routes.mjs";

const OUT_DIR = "./dist";
const STATIC_DIR = "./static";
const JSON_FILE = "content.json";

const JSON_FIELDS = {
  default: ["layout", "id", "name", "contentHtml"],
  book: [
    "date",
    "subtitle",
    "author",
    "authorId",
    "pageCount",
    "written",
    "stars",
    "tags",
    "mapping",
    "gender",
    "translatedFrom",
    "series",
    "previouslyRead",
  ],
  author: ["gender", "mapping"],
  tags: ["specialization"],
  location: ["latitude", "longitude"],
};

function postAsJson(post) {
  const savedFields = [
    ...JSON_FIELDS.default,
    ...(JSON_FIELDS[post.layout] ?? []),
  ];
  const data = Object.fromEntries(
    savedFields.flatMap((field) => (post[field] ? [[field, post[field]]] : []))
  );
  return data;
}

async function createJson(posts) {
  const content = JSON.stringify(posts.map(postAsJson), null, 2);
  await fs.writeFile(path.join(OUT_DIR, JSON_FILE), content);
}

async function copyStatic() {
  await fs.cp(STATIC_DIR, OUT_DIR, { recursive: true });
}

async function build() {
  const allPosts = await normalizePosts(parsePosts());
  await fs.mkdir(OUT_DIR, { recursive: true });
  await createJson(allPosts);
  await copyStatic();

  console.log(ROUTES);
}

build();
