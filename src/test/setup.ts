import "fake-indexeddb/auto";

if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
  const getComputedStyleWithoutPseudo = window.getComputedStyle.bind(window);
  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    value: (element: Element) => getComputedStyleWithoutPseudo(element),
  });
}

if (typeof globalThis.FontFace === "undefined") {
  Object.defineProperty(globalThis, "FontFace", {
    configurable: true,
    value: class FontFaceMock {
      status = "loaded";
      loaded = Promise.resolve(this);
      constructor(public family: string, public source: string | ArrayBuffer) {}
      load() { return Promise.resolve(this); }
    },
  });
}

if (typeof HTMLCanvasElement !== "undefined") {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value() {
      return {
        canvas: this,
        clearRect() {},
        drawImage() {},
        fillRect() {},
        fillText() {},
        getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
        measureText: (text: string) => ({ width: text.length * 8 }),
        putImageData() {},
        restore() {},
        rotate() {},
        save() {},
        scale() {},
        setTransform() {},
        strokeRect() {},
        translate() {},
      };
    },
  });
}

if (typeof document !== "undefined" && !("fonts" in document)) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      add() {},
      check: () => true,
      clear() {},
      delete: () => true,
      load: async () => [],
      ready: Promise.resolve(),
      status: "loaded",
    },
  });
}
