import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAvatarDataUrl, isAllowedAvatarUrl } from "./avatar";

const AVATAR_URL = "https://avatars.githubusercontent.com/u/1234?v=4";

function okImageResponse() {
  return {
    ok: true,
    headers: new Headers({ "content-type": "image/jpeg" }),
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isAllowedAvatarUrl", () => {
  it("accepts the GitHub avatar CDN over https", () => {
    expect(isAllowedAvatarUrl(AVATAR_URL)).toBe(true);
  });

  it.each([
    ["http on the allowed host", "http://avatars.githubusercontent.com/u/1"],
    ["cloud metadata endpoint", "http://169.254.169.254/latest/meta-data/"],
    ["localhost", "https://localhost:5432/"],
    ["arbitrary https host", "https://evil.example.com/avatar.png"],
    ["subdomain spoof", "https://avatars.githubusercontent.com.evil.com/x"],
    ["not a URL", "not a url"],
  ])("rejects %s", (_label, url) => {
    expect(isAllowedAvatarUrl(url)).toBe(false);
  });
});

describe("fetchAvatarDataUrl", () => {
  it("resolves an allowed URL to a data URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okImageResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAvatarDataUrl(AVATAR_URL);

    expect(fetchMock).toHaveBeenCalledWith(AVATAR_URL);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("never fetches a disallowed URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchAvatarDataUrl("http://169.254.169.254/latest/meta-data/")).toBeNull();
    expect(await fetchAvatarDataUrl("https://internal.service.local/secret")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null for a null URL", async () => {
    expect(await fetchAvatarDataUrl(null)).toBeNull();
  });

  it("returns null when the fetch fails or is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));
    expect(await fetchAvatarDataUrl(AVATAR_URL)).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await fetchAvatarDataUrl(AVATAR_URL)).toBeNull();
  });
});
