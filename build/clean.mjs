import { stringify } from "yaml";
import fs from "fs";

import { normalizePosts, parsePosts } from "./parse.mjs";
import path from "path";
/** @import { PostInfo } from "./parse.mjs" */

const SAVED_FIELDS = {
  default: ["layout", "id", "name"],
  book: [
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

/**
 *
 * @param {PostInfo} post
 */
function postAsFile(post, allPosts) {
  const filename =
    post.layout === "book"
      ? `posts/${post.date}-${post.id}.md`
      : `meta/${post.layout}/${post.id}.md`;
  const savedFields = [
    ...SAVED_FIELDS.default,
    ...(SAVED_FIELDS[post.layout] ?? []),
  ];
  const headerData = Object.fromEntries(
    savedFields.flatMap((field) => (post[field] ? [[field, post[field]]] : []))
  );
  if (headerData.tags) {
    headerData.tags = headerData.tags.join(" ");
  }
  if (headerData.mapping) {
    headerData.mapping = allPosts.find(
      ({ layout, id }) => layout === "location" && id === headerData.mapping[0]
    )?.name;
  }

  const content = `---\n${stringify(headerData)}---\n${
    post.content?.length ? `${post.content}` : ""
  }`;
  return [filename, content];
}

async function rewriteFiles() {
  const allPosts = await normalizePosts(parsePosts());
  const postFiles = allPosts.map((post, _, allPosts) =>
    postAsFile(post, allPosts)
  );

  for (const [filename, content] of postFiles) {
    if (filename) {
      const fullPath = `./posts2/${filename}`;
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
    }
  }
}

rewriteFiles();
