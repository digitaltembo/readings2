import { bookDisplayConcise } from "./display.mjs";

export function populateTimeline(nodes) {
  document.getElementById("timeline-container").style.display = "none";
  const books = nodes.filter(({ layout, date }) => layout === "book" && date);
  books.sort((a, b) => b.date.localeCompare(a.date));

  const timelineContents = document.getElementById("timeline-contents");
  timelineContents.innerHTML = books.map(bookDisplayConcise).join("");
  console.log("Displayed!");

  const timeline = document.getElementById("timeline");
  const start = new Date(books[books.length - 1].date);
  const end = new Date(books[0].date);
  let contents = "";

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  });

  const circledDates = new Set(
    books.map(({ date }) => {
      const d = new Date(date);
      return `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
    })
  );

  for (let iter = end; iter >= start; iter.setDate(iter.getDate() - 1)) {
    const date = iter.getDate();

    if (date === 1) {
      contents += `<div class="timeline-month"></div><span class="timeline-label"><span class="timeline-month-label">${formatter.format(
        iter
      )}</span></span>`;
    } else if (date % 10 === 1) {
      contents += '<div class="timeline-ten-days"></div>';
    } else {
      contents += '<div class="timeline-day"></div>';
    }
    if (circledDates.has(`${iter.getFullYear()}${iter.getMonth()}${date}`)) {
      contents +=
        '<span class="timeline-label"><span class="timeline-book-label">o</span></span>';
    }
  }
  // timeline.innerHTML = contents;
}
