import { sampleState, validateState } from "./domain.js";

export const STORAGE_KEY = "eggtrack.demo.v1";

// Replace this boundary with an authenticated API adapter after schema review.
// Future stock checks must run transactionally on the server, not only here.
export function createRepository(storage) {
  let baseline;
  return {
    load() {
      baseline = storage.getItem(STORAGE_KEY);
      return baseline === null
        ? sampleState()
        : validateState(JSON.parse(baseline));
    },
    save(state, { replace = false } = {}) {
      const current = storage.getItem(STORAGE_KEY);
      if (!replace && current !== baseline)
        throw new Error(
          "Demo data changed in another tab. Reload this page before saving.",
        );
      const serialized = JSON.stringify(validateState(state));
      try {
        storage.setItem(STORAGE_KEY, serialized);
      } catch {
        throw new Error(
          "Could not save demo data. Browser storage may be full or disabled. This transaction was not saved.",
        );
      }
      baseline = serialized;
    },
  };
}
