import { getCorsOrigins, getCorsOriginConfig } from "./cors";

describe("CORS helpers", () => {
  const originalEnv = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.FRONTEND_URL = originalEnv;
  });

  describe("getCorsOrigins", () => {
    it("returns default when FRONTEND_URL is unset", () => {
      delete process.env.FRONTEND_URL;
      expect(getCorsOrigins()).toEqual(["http://localhost:5173"]);
    });

    it("returns single origin when FRONTEND_URL is set", () => {
      process.env.FRONTEND_URL = "https://assistance.imedizin.com";
      expect(getCorsOrigins()).toEqual(["https://assistance.imedizin.com"]);
    });

    it("returns multiple origins when FRONTEND_URL is comma-separated", () => {
      process.env.FRONTEND_URL =
        "https://assistance.imedizin.com,https://staging.imedizin.com";
      expect(getCorsOrigins()).toEqual([
        "https://assistance.imedizin.com",
        "https://staging.imedizin.com",
      ]);
    });

    it("trims whitespace around origins", () => {
      process.env.FRONTEND_URL = " https://a.com , https://b.com ";
      expect(getCorsOrigins()).toEqual(["https://a.com", "https://b.com"]);
    });

    it("filters empty segments", () => {
      process.env.FRONTEND_URL = "https://a.com,,https://b.com";
      expect(getCorsOrigins()).toEqual(["https://a.com", "https://b.com"]);
    });
  });

  describe("getCorsOriginConfig", () => {
    it("returns string for single origin", () => {
      process.env.FRONTEND_URL = "https://assistance.imedizin.com";
      expect(getCorsOriginConfig()).toBe("https://assistance.imedizin.com");
    });

    it("returns array for multiple origins", () => {
      process.env.FRONTEND_URL =
        "https://assistance.imedizin.com,https://staging.imedizin.com";
      expect(getCorsOriginConfig()).toEqual([
        "https://assistance.imedizin.com",
        "https://staging.imedizin.com",
      ]);
    });

    it("returns default when unset", () => {
      delete process.env.FRONTEND_URL;
      expect(getCorsOriginConfig()).toBe("http://localhost:5173");
    });
  });
});
