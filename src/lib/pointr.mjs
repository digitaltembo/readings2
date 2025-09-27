import ForceGraph3D from "3d-force-graph";

/** @template {{id: string}} Node Node in a graph, point to chart */
export class Pointr {
  /** @type Node[] */
  nodes;
  /**
   * @typedef {Object} Link Link between nodes in the graph
   * @prop {string} source "id" of the source node
   * @prop {string} target "id" of the target node
   * @prop {string} type string describing the type of link
   */
  /** @type Link[] */
  links;

  /** @typedef {(alpha: number) => void} Force */
  /** @typedef {[forceFunction: Force, isEnabled: boolean]} ForceDefinition */
  /** @type Record<string, ForceDefinition> */
  forces;

  /** @type  ForceGraph3d */
  graph;

  /**
   * @param {HTMLElement} element Element to expand and create a Canvas from
   * @param {Node[]} nodes list of nodes to plot
   * @param {Link[]} links potential list of links
   */
  constructor(element, nodes, links = []) {
    this.nodes = nodes;
    this.links = links;
    this.graph = new ForceGraph3D(element).backgroundColor("#000003");
    if (this.links.length > 0) {
      this.graph.graphData({ nodes: this.nodes, links: this.links });
    }

    this.forces = {
      center: [this.graph.d3Force("center"), true],
      link: [this.graph.d3Force("link"), true],
      charge: [this.graph.d3Force("charge"), true],
    };
  }

  /**
   * Disables a force from the d3Force map
   * @param {string} force Name of force in force map
   */
  disableForce = (force) => {
    this.graph.d3Force(force, null);
    this.forces[force][1] = false;
  };

  /**
   * Enable a set of forces in the d3ForceMap. Will need to reheat simulation after changing
   * @param  {...string[]} forces  Name of previously defined forces in force map
   */
  enableForce = (...forces) => {
    forces.map((force) => {
      if (!this.forces[force]) {
        console.warn("Cannot enable nonexistant force", force);
      } else if (!this.forces[force][1]) {
        this.graph.d3Force(force, this.forces[force][0]);
        this.forces[force][1] = true;
      }
    });
  };

  /**
   * Disables all currently enabled forces
   */
  clearForces = () => {
    Object.keys(this.forces).map((force) => {
      this.graph.d3Force(force, null);
      this.forces[force][1] = false;
    });
  };

  /**
   * Adds a force to the force map and enables it
   * @param {string} name
   * @param {Force} force
   */
  addForce = (name, force) => {
    this.graph.d3Force(name, force);
    this.forces[name] = [force, true];
  };

  /**
   * Clears forces, enables the forces necessary to make this a force-map graph,
   * and then renders either all links (if linkTypes is not specified)
   * or renders specifically all links whose type is in linkTypes
   * @param {string[] | undefined} linkTypes
   */
  plotGraph = (linkTypes) => {
    this.clearForces();
    this.enableForce("center", "link", "charge");
    this.graph.graphData({
      nodes: this.nodes,
      links: linkTypes
        ? this.links.filter(({ type }) => linkTypes.includes(type))
        : this.links,
    });
  };

  /**
   * Moves all nodes to locations specified by the nodeToPointFn
   * If a dimension is not specified, the node will not move in that dimension
   * @param {(node: Node) => Partial<{x: number, y: number, z: number}} nodeToPointFn
   * @param {number} strength Strength of force which will push node into place
   */
  plotPoints = (nodeToPointFn, strength = 0.05) => {
    const nodeDests = this.nodes.map(nodeToPointFn);

    const forceToPoints = (alpha) => {
      this.nodes.map((node, index) => {
        const dest = nodeDests[index];
        if (dest == null) {
          return;
        }
        for (const dim of ["x", "y", "z"]) {
          if (dim in dest) {
            node[`v${dim}`] += strength * (dest[dim] - node[dim]) * alpha;
          }
        }
      });
    };

    this.clearForces();
    this.addForce("move", forceToPoints);
    this.graph.d3ReheatSimulation();
  };

  /**
   * @template T
   * @typedef {string | T | (node: Node) => T} DimensionSpecification<T>
   */

  /**
   * Takes in a manner of specifying a dimensional value,
   * and returns a function that should map from a node to
   * that value, either through field access
   * @template T
   * @param {DimensionSpecification<T>} dim
   * @returns {(node: Node) => T}
   */
  getDimension = (dim) => {
    if (typeof dim == "string") {
      if (dim.includes(".")) {
        const dimParts = dim.split(".");
        return (node) =>
          dimParts.reduce(
            (curNode, part) =>
              typeof curNode === "object" ? curNode?.[part] : undefined,
            node
          ) ?? null;
      }
      return (node) => node[dim];
    } else if (typeof dim == "function") {
      return dim;
    }
    return () => dim ?? null;
  };

  /**
   *
   * @param {DimensionSpecification<number | string | null>} dim
   * @returns {DimensionInfo}
   */
  getDimensionInfo = (dim) => {
    return this.nodes.reduce(
      (info, node) => {
        const val = dim(node);
        if (val == null) {
          return info;
        }
        if (typeof val == "number") {
          if (info.type === "unknown" || info.type === "number") {
            info.type = "number";
            info.min = Math.min(info.min ?? Number.POSITIVE_INFINITY, val);
            info.max = Math.max(info.max ?? Number.NEGATIVE_INFINITY, val);
          } else {
            info.type = "category";
          }
        } else {
          console.log("heyy", val);
          info.type = "category";
        }
        return info;
      },
      { type: "unknown" }
    );
  };

  /**
   * @param {DimensionSpecification<number | string | null>} dim
   * @param {boolean} normalize
   * @param {number} min
   * @param {number} max
   * @param {number | null} defaultVal
   * @returns {(n: Node) => number | null}
   */
  getDimensionMap = (dim, min, max, defaultVal) => {
    if (dim == null) {
      return () => defaultVal;
    }
    const dimensionFn = this.getDimension(dim);
    // if (!normalize) {
    //   return dimensionFn;
    // }
    const dimensionInfo = this.getDimensionInfo(dimensionFn);
    console.log({ dim, dimensionInfo, fn: dimensionFn(this.nodes[0]) });
    if (dimensionInfo.type === "number") {
      if (
        Number.isNaN(dimensionInfo.min) ||
        Number.isNaN(dimensionInfo.max) ||
        dimensionInfo.min === dimensionInfo.max
      ) {
        return () => defaultVal;
      }
      return (node) => {
        const val = dimensionFn(node);
        return val == null
          ? defaultVal
          : ((max - min) * (val - dimensionInfo.min)) /
              (dimensionInfo.max - dimensionInfo.min) +
              min;
      };
    } else if (dimensionInfo.type == "category") {
      const cats = this.nodes.reduce((acc, node) => {
        const val = dimensionFn(node);

        if (val == null || acc[val] != null) {
          return acc;
        }
        return { ...acc, [val]: Object.keys(acc).length };
      }, {});
      const catCount = Object.keys(cats).length;
      return (node) => {
        const val = dimensionFn(node);
        if (val == null) {
          return defaultVal;
        }
        return ((max - min) * cats[val]) / catCount + min;
      };
    } else {
      return () => defaultVal;
    }
  };

  /**
   * @typedef {Object} Plot
   * @prop {DimensionSpecification<number | string | null | undefined> x}
   */
  /**
   *
   * @param {Plot} plotObj
   */
  plot = ({ color, ...plt }) => {
    this.clearForces();

    this.graph.graphData({ nodes: this.nodes, links: [] });
    // this.graph.linkVisibility(false);
    const range = 500;

    const { x, y, z, r, theta, phi, size } = {
      x: plt.x && this.getDimensionMap(plt.x, -range, range, -2 * range),
      y: plt.y && this.getDimensionMap(plt.y, -range, range, -2 * range),
      z: plt.z && this.getDimensionMap(plt.z, -range, range, -2 * range),
      r: plt.r && this.getDimensionMap(plt.r, 0, range, 200),
      theta: plt.theta && this.getDimensionMap(plt.theta, 0, Math.PI, 0),
      phi: plt.phi && this.getDimensionMap(plt.phi, 0, 2 * Math.PI, 0),
      size: plt.size && this.getDimensionMap(plt.size, 1, 10, 0),
    };

    if (color) {
      this.graph.nodeAutoColorBy(this.getDimension(color));
    }
    if (plt.size) {
      this.graph.nodeVal(size);
    }

    const cartesian = plt.x || plt.y || plt.z;

    if (cartesian) {
      this.plotPoints((node) => {
        return {
          x: x?.(node),
          y: y?.(node),
          z: z?.(node),
        };
      }, plt.strength);
    } else {
      this.plotPoints((node) => {
        const [rVal, thetaVal, phiVal] = [r(node), theta(node), phi(node)];
        return {
          x: rVal * Math.sin(thetaVal) * Math.cos(phiVal),
          y: rVal * Math.sin(thetaVal) * Math.sin(phiVal),
          z: rVal * Math.cos(thetaVal),
        };
      }, plt.strength);
    }
  };

  /**
   * @typedef {{x: number, y: number, z: number}} Point
   */
  /**
   *
   * @param {(n: Node, p: Point) => Point | false | null} validateNodeLoc
   */
  distribute = (validateNodeLoc, strength = 0.06) => {
    const destinations = Object.fromEntries(
      this.nodes.map((node) => {
        /** @type Point | false | null */
        let foundLocation = false;
        while (!foundLocation) {
          foundLocation = validateNodeLoc(node, {
            x: Math.random(),
            y: Math.random(),
            z: Math.random(),
          });
          if (foundLocation === null) {
            return [node.id, null];
          }
        }
        return [node.id, foundLocation];
      })
    );
    this.plotPoints((node) => destinations[node.id], strength);
  };

  pie = (dim, radius = 100) => {
    this.plotGraph([]);
    const categorizer = this.getDimension(dim);
    const cats = this.nodes.reduce((cats, node) => {
      const cat = categorizer(node);
      if (cat === null) {
        return cats;
      }
      if (!cats[cat]) {
        cats[cat] = { s: new Set([node]) };
      } else {
        cats[cat].s.add(node);
      }
      return cats;
    }, {});

    const sortedCats = Object.values(cats);
    sortedCats.sort((a, b) => b.s.size - a.s.size);

    const size = sortedCats.reduce((total, { s }) => total + s.size, 0);

    let offset = 0;
    /** @type {Record<string, (p: Point) => Point} */
    const perNodeMaps = {};

    for (const cat of sortedCats) {
      const pAngle = offset;
      const nAngle = offset + (cat.s.size / size) * 2 * Math.PI;
      const catMap = ({ x, y }) => {
        const r = radius * Math.sqrt(x);
        const theta = y * (nAngle - pAngle) + pAngle;
        return { x: r * Math.cos(theta), y: r * Math.sin(theta), z: 0 };
      };
      offset = nAngle;
      cat.s.forEach((node) => (perNodeMaps[node.id] = catMap));
    }
    this.graph.nodeAutoColorBy(categorizer);
    this.distribute((n, p) => perNodeMaps[n.id](p) ?? { x: 0, y: 0, z: 0 });
  };

  /**
   * @param {string} type
   */
  clearLinksOfType = (type) => {
    this.links =
      this.links?.filter(
        ({ type: previousLinkType }) => type !== previousLinkType
      ) ?? [];
  };
  /**
   *
   * @param {string} type
   * @param {DimensionSpecification<string[] | string>} dim
   */
  addLinksPerNode = (type, dim) => {
    this.clearLinksOfType(type);
    const dimension = this.getDimension(dim);
    let i = 0;
    for (const node of this.nodes) {
      const potentialLinks = dimension(node);

      if (Array.isArray(potentialLinks)) {
        this.links = this.links.concat(
          potentialLinks.flatMap((target) => {
            if (typeof target === "string") {
              return [{ source: node.id, target, type }];
            } else if (target?.id) {
              return [{ source: node.id, target: target.id, type }];
            }
            return [];
          })
        );
      }
      if (typeof potentialLinks === "string") {
        this.links.push({ source: node.id, target: potentialLinks, type });
      }
    }
  };

  addLinksByOrdering = (type, dim) => {
    this.clearLinksOfType(type);
    const dimension = this.getDimension(dim);

    const ordering = this.nodes.flatMap((node) => {
      const val = dimension(node);
      if (val != null) {
        return [{ id: node.id, val }];
      }
      return [];
    });
    let pId = null;
    ordering.sort(({ val: a }, { val: b }) => {
      if (typeof a === "number" && typeof b === "number") {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });
    for (const { id, val } of ordering) {
      if (pId) {
        this.links.push({ source: pId, target: id, type });
      }
      pId = id;
    }
  };
}
