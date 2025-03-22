import fs from "fs";
import Showdown from "showdown";

const POST_DIR = "./posts";

function parsePost(filePath) {}
function parsePosts() {
  const dir = fs.readdirSync(POST_DIR);
  const posts = {
    authors: {},
    books: {},
    locations: {},
    tags: {},
    languages: {},
  };

  for (const ent of dir) {
    parsePost(ent);
  }
  console.log(Showdown);
}

parsePosts();
