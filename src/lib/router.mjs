const URL_REGEX_SWAPPER = /(\:[^\\]+)/gm;

/**
 * @template {{url: string, route?: string}} T
 */
export class Router extends EventTarget {
  /**
   * @typedef {Object} RouterUrl
   * @prop {string} route Name of the url route, with placehoders like :foo
   * @prop {string} regex Regex matcher for the route
   */
  /** @type RouterUrl[] */
  urls;

  /** @type T */
  state;
  /** @type T */
  previousState;

  /**
   * @param {string[]} urls
   */
  constructor(...urls) {
    super();
    this.urls = urls.map((url) => ({
      route: url,
      regex:
        "^" +
        url
          .replaceAll("/", "\\/")
          .replaceAll(URL_REGEX_SWAPPER, "(?<$1>[^/]+)")
          .replaceAll("<:", "<") +
        "$",
    }));
    this.state = this.parseState(window.location.pathname);
    this.previousState = { ...this.state };
    document.addEventListener("click", (e) => {
      let target = e.target.closest("a");
      if (target) {
        if (target.getAttribute("href").startsWith("/")) {
          e.preventDefault();
          console.log("Intercepting link click", target.getAttribute("href"));
          this.goTo(target.getAttribute("href"));
        }
      }
    });
  }

  /**
   *
   * @param {string | T} urlOrState
   * @param {boolean} includeInHistory
   */
  goTo = (urlOrState, skipDispatch, skipHistory) => {
    const newUrl = this.updateState(urlOrState);
    console.log("replacing url", newUrl);
    if (skipHistory) {
      window.history.replaceState(this.state, "", newUrl);
    } else {
      window.history.replaceState(this.state, "", newUrl);
      // TODOO right now there seem to be some url management bugs
      // window.history.pushState(this.state, "", newUrl);
    }
    if (!skipDispatch) {
      this.dispatchEvent(
        new CustomEvent("route", {
          detail: { ...this.state, previousState: this.previousState },
        })
      );
    }
  };

  goBack = (skipDispatch, skipHistory) => {
    console.log("back1??");
    this.goTo(this.previousState, skipDispatch, skipHistory);
  };

  /**
   *
   * @param {string | T} urlOrState
   * @returns {string} new URL
   */
  updateState = (urlOrState) => {
    if (typeof urlOrState === "string") {
      this.previousState = { ...this.state };
      this.state = this.parseState(urlOrState);
      return urlOrState;
    } else {
      this.previousState = { ...this.state };
      this.state = urlOrState;
      return this.urlOf(urlOrState);
    }
  };

  /**
   *
   * @param {string} url
   * @returns {T}
   */
  parseState = (url) => {
    for (const { route, regex } of this.urls) {
      const match = url.match(regex);
      if (match) {
        return { ...match.groups, route, url };
      }
    }
    return { url };
  };

  /**
   *
   * @param {Omit<T, "url">} state
   * @returns {string}
   */
  urlOf = (state) => {
    return Object.entries(state).reduce(
      (newUrl, [key, value]) => newUrl.replaceAll(":" + key, value),
      state.route
    );
  };
}
