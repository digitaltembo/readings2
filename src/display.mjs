const TAG_ICONS = {
  listened: "headphones",
  read: "book",
  mystery: "search",
  scifi: "rocket",
  fantasy: "hat-wizard",
  "non-fiction": "earth-americas",
  historical: "landmark",
  adventure: "mountain",
  sailing: "sailboat",
};

const RATING_DESCRIPTIONS = [
  "Not Rated",
  "Didn't like it",
  "It was OK",
  "Liked it",
  "Really liked it",
  "Loved it",
];

const ignoredTags = ["read", "unreviewed", "listened"];

/**
 * @param {String} HTML representing a single node (which might be an Element,
 *                  a text node, or a comment).
 * @return {Node}
 */
export function htmlToNode(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const nNodes = template.content.childNodes.length;
  if (nNodes !== 1) {
    throw new Error(
      `html parameter must represent a single node; got ${nNodes}. ` +
        "Note that leading or trailing spaces around an element in your " +
        'HTML, like " <img/> ", get parsed as text nodes neighbouring ' +
        "the element; call .trim() on your input to avoid this."
    );
  }
  return template.content.firstChild;
}

export function starDisplay(stars) {
  if (stars == null) {
    return "";
  }

  const rating = RATING_DESCRIPTIONS[Math.floor(stars)];

  return `<span class="rating" title="${rating}"> ${Array.from({ length: 5 })
    .map((_, i) =>
      i < stars - 0.5
        ? '<i class="fa fa-star"></i>'
        : i >= stars
        ? '<i class="fa fa-star-o"></i>'
        : '<i class="fa fa-star-half-alt"></i>'
    )
    .join(" ")}</span>`;
}

function tagDisplayConcise(tag) {
  const icon = TAG_ICONS[tag];
  return icon ? `<i class='fa fa-solid fa-${icon}' title='${tag}'></i>` : "";
}
export function tagDisplay(tag) {
  return tagDisplayConcise(tag) + " " + tag;
}

export function bookDisplayConcise({ id, name, author, stars, tags }) {
  return `<div class="concise-book"><a href="/blog/${id}">
    <span class="row">
      <span class="title">${name}</span>
      ${starDisplay(stars)}
    </span>
    ${author ? `<span class="row"><span class="author">${author}</span>` : ""}
  </a></div>`;
}

function likeBooksDisplay(title, books) {
  if (!books?.length) {
    return "";
  }
  return `
    <h3>${title}:</h3>
    <ol class="book-list">
      ${books
        .slice(0, 10)
        .map((book) => `<li>${bookDisplayConcise(book)}</li>`)
        .join(" ")}
    </ol>`;
}

function bookDisplay({
  stars,
  review,
  name,
  author,
  written,
  date,
  tags,
  id,
  translatedFrom,
  mapping,
}) {
  const like = {
    sameAuthor: [],
    tags: [],
    mapping: [],
    language: [],
  };
  for (const comparedTo of pointr.nodes) {
    if (comparedTo.id === id) {
      continue;
    }
    if (comparedTo.layout === "book") {
      if (comparedTo.author === author) {
        like.sameAuthor.push(comparedTo);
      }
      const sharedTags =
        comparedTo?.tags?.filter(
          (tag) => !ignoredTags.includes(tag) && tags?.includes(tag)
        ) ?? [];
      if (sharedTags.length > 0) {
        like.tags.push([sharedTags.length, comparedTo]);
      }
      if (comparedTo.author !== author) {
        // don't link books by the same author,
        // they are very likely to be in the same location and language
        if (comparedTo.mapping?.includes(mapping?.[0])) {
          like.mapping.push(comparedTo);
        }

        if (translatedFrom && translatedFrom === comparedTo.translatedFrom) {
          like.language.push(comparedTo);
        }
      }
    }
  }

  like.sameAuthor.sort((a, b) => b.stars - a.stars);
  like.mapping.sort((a, b) => b.stars - a.stars);

  like.tags.sort((a, b) => b.stars - a.stars).sort((a, b) => b[0] - a[0]);
  like.language.sort((a, b) => b.stars - a.stars);
  return `
    <header>
      <h1>${name}</h1>
      <p class="meta">
      ${starDisplay(stars)}
      </p>
      <p class="meta">
        <a href="/connections/author/${author}">${author}</a>
        ${written ? `| Written ${written} ` : ""}
        ${
          date
            ? ` | Read on ${Intl.DateTimeFormat(undefined, {
                dateStyle: "long",
              }).format(new Date(date))}`
            : ""
        }
      </p>

      <p class="meta">${tags
        .map(
          (tag) =>
            `<a class="button-link" href="/connections/tag/${tag}">${tag}</a>`
        )
        .join(" ")}</p>
    </header>
    ${review || ""}
    <div>
      ${
        !mapping?.length
          ? ""
          : `<p class="meta"><a href='/connections/location/${mapping[0]}'>
              <i class="fa fa-map-marker-alt"></i> 
              ${mapping[0]}
            </a></p>`
      }

      ${likeBooksDisplay(
        `Also by ${author}`,
        like.sameAuthor.map((book) => ({ ...book, author: undefined }))
      )}

      ${likeBooksDisplay(
        `Also translated from ${translatedFrom}`,
        like.language
      )}
      ${likeBooksDisplay(`Also from ${mapping?.[0]}`, like.mapping)}
      ${likeBooksDisplay(
        `Books with common tags`,
        like.tags
          .filter(([sharedTagCount]) => sharedTagCount > 1)
          .map(([_, book]) => book)
      )}
    </div> `;
}
export function nodeDiplay(node, concise) {
  if (node.layout === "book") {
    return concise ? bookDisplayConcise(node) : bookDisplay(node);
  }
}
