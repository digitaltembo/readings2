import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { Pointr } from "./lib/pointr.mjs";
import { Router } from "./lib/router.mjs";
import { nodeDiplay, starDisplay } from "./display.mjs";
import { populateTimeline } from "./timeline.mjs";

async function main() {
  const nodes = await fetch("./content.json").then((r) => r.json());

  const pointr = new Pointr(document.getElementById("3d-pointr.graph"), nodes);

  const ignoredTags = ["read", "unreviewed", "listened"];

  const router = new Router(
    "/",
    "/blog/:book",
    "/connections/:connectionType/:id",
    "/authors/:author"
  );

  pointr.addLinksPerNode("authorId", "authorId");
  pointr.addLinksPerNode("tag", (node) =>
    node.tags?.filter((tag) => !ignoredTags.includes(tag))
  );
  pointr.addLinksPerNode("location", (node) =>
    node.layout === "book" && node.mapping?.length > 0
      ? node.mapping.slice(0, -1)
      : null
  );
  pointr.addLinksByOrdering("written", "written");
  pointr.addLinksByOrdering("date", "date");
  pointr.plotGraph(["authorId", "tag", "location"]);

  let highlighting = true;
  const toggleHighlight = (node, overrideHighlight = false, zoom = false) => {
    if (highlighting || overrideHighlight) {
      if (
        node?.layout === "author" ||
        node?.layout === "tag" ||
        node?.layout === "location"
      ) {
        pointr.graph
          .linkVisibility(({ target }) => target.id === node.id)
          .linkWidth(4);
        if (zoom) {
          const validNodeIds = new Set(
            pointr.links
              .filter(({ target }) => target.id === node.id)
              .map(({ source }) => source.id)
          );
          console.log(
            pointr.graph.getGraphBbox(),
            pointr.graph.getGraphBbox(({ id }) => validNodeIds.has(id))
          );
          pointr.graph.zoomToFit(800, 10, ({ id }) => validNodeIds.has(id));
        }
      } else {
        pointr.graph.linkVisibility(true).linkWidth(0);
      }
    }
  };
  pointr.graph
    .backgroundColor("#000003")
    .nodeLabel(({ id, name, author, stars, layout }) =>
      layout === "book"
        ? `${name}<br />by <i>${author}<i><br/>${starDisplay(stars)}`
        : layout === "author"
        ? `${name} (author)`
        : layout === "location"
        ? `${name} (location)`
        : `${id}: (tag)`
    );
  // .onNodeHover((node) => toggleHighlight(node))
  // .onBackgroundClick(() => {
  //   console.log("bg");
  //   router.goTo("/");
  // });

  window.pointr = pointr;
  let displayingStuff = false;
  pointr.graph.onNodeClick((node) => {
    if (node.layout === "book" && !displayingStuff) {
      console.log("node clicked!");
      router.goTo(`/blog/${node.id}`);
    } else {
      console.log("connections");

      router.goTo(`/connections/${node.layout}/${node.id}`);
    }
  });

  const cont = pointr.graph.controls();

  const cam = pointr.graph.camera();
  cam.near = 0.0001;
  cam.zoom = 1.001;
  cam.updateProjectionMatrix();
  cont.addEventListener("change", (e) => {
    if (router.state.route === "/blog/:book" && displayingStuff) {
      document.getElementById("content").innerHTML = "";
      router.goBack(true);
      displayingStuff = false;
    }
  });
  const bloomPass = new UnrealBloomPass();
  bloomPass.strength = 2;
  bloomPass.radius = 1;
  bloomPass.threshold = 0;
  pointr.graph.postProcessingComposer().addPass(bloomPass);

  function showBook(id) {
    const node = pointr.nodes.find(({ id: idToFind }) => idToFind === id);
    console.log("showing book", node);
    // Aim at node from outside it
    const distance = 4.5;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    const newPos =
      node.x || node.y || node.z
        ? {
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio,
          }
        : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
    console.log("Moving");
    pointr.graph.cameraPosition(
      newPos, // new position
      { y: node.y, ...node }, // lookAt ({ x, y, z })
      1800 // ms transition duration
    );
    console.log("Moved");

    window.setTimeout(() => {
      displayingStuff = true;
      console.log("Displaying");
      const before = Date.now();
      document.getElementById("content").innerHTML = nodeDiplay(node);
      console.log("Rendering took", Date.now() - before);
      document.getElementById(
        "footer"
      ).innerHTML = `<a href="/"><i class="fa-solid fa-angles-down"></i> Back</a>`;
    }, 1800);
  }
  function showConnections(_connectionType, id, zoom) {
    highlighting = false;
    console.log("stopping");
    toggleHighlight(
      pointr.nodes.find(({ id: idToFind }) => idToFind === id),
      true,
      zoom
    );
  }
  router.addEventListener("route", (event) => {
    console.log(event);
    document.getElementById("content").innerHTML = "";
    displayingStuff = false;

    switch (event.detail?.route) {
      case "/":
        if (event.detail?.previousState?.route === "/blog/:book") {
          pointr.graph.zoomToFit(800);
        }
        highlighting = true;
        pointr.graph.linkVisibility(true).linkWidth(0);
        break;
      case "/blog/:book":
        showBook(event.detail?.book);
        break;
      case "/connections/:connectionType/:id":
        showConnections(
          event.detail?.connectionType,
          event.detail?.id,
          event.detail?.previousState?.route === "/blog/:book"
        );
        break;
      default:
        console.log("uncaught?");
    }
  });

  // populateTimeline(nodes);
}

main();
