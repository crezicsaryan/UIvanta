import dns from "node:dns/promises";
import net from "node:net";

/**
 * URL hardening for user-supplied references.
 *
 * Strategy (defence in depth):
 *  1. Scheme allow-list.
 *  2. Hostname deny-list (localhost, metadata endpoints, internal TLDs).
 *  3. DNS resolution + IP classification before any request.
 *  4. Manual redirect handling, re-validating every hop.
 *  5. Post-request re-resolution to catch DNS rebinding.
 *  6. Hard byte / time limits on the response body.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa", ".lan"];

function ipv4ToParts(ip: string): number[] | null {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  return parts;
}

function isBlockedIpv4(ip: string): boolean {
  const p = ipv4ToParts(ip);
  if (!p) return true;
  const [a, b] = p;

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 198 && b === 51 && p[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && p[2] === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIpv4(ip);
  if (family === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
        normalized.startsWith("fea") || normalized.startsWith("feb")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
    if (normalized.startsWith("ff")) return true; // multicast
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);
      if (net.isIP(mapped) === 4) return isBlockedIpv4(mapped);
      // IPv4-mapped hex form, e.g. ::ffff:7f00:1
      const hex = mapped.split(":");
      if (hex.length === 2) {
        const hi = parseInt(hex[0], 16);
        const lo = parseInt(hex[1], 16);
        if (Number.isFinite(hi) && Number.isFinite(lo)) {
          const v4 = `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
          return isBlockedIpv4(v4);
        }
      }
      return true;
    }
    // 6to4 / Teredo could tunnel to private space — reject conservatively
    if (normalized.startsWith("2002:") || normalized.startsWith("2001:0:")) return true;
    return false;
  }
  return true; // not an IP we understand
}

export type GuardResult =
  | { ok: true; url: URL; addresses: string[] }
  | { ok: false; code: string; message: string; hint?: string };

function hostnameIsBlocked(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (net.isIP(host)) return isBlockedIp(host);
  return false;
}

export async function guardUrl(raw: string): Promise<GuardResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, code: "EMPTY_URL", message: "Enter a website URL to analyze." };
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "That doesn't look like a valid URL.",
      hint: "Use a full address such as https://example.com",
    };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEME",
      message: `Only http and https addresses can be analyzed (received ${url.protocol.replace(":", "")}).`,
      hint: "Try the https:// version of the page.",
    };
  }

  if (url.username || url.password) {
    return {
      ok: false,
      code: "CREDENTIALS_IN_URL",
      message: "URLs containing credentials are not accepted.",
    };
  }

  if (!url.hostname) {
    return { ok: false, code: "INVALID_URL", message: "The URL is missing a hostname." };
  }

  if (hostnameIsBlocked(url.hostname)) {
    return {
      ok: false,
      code: "BLOCKED_DESTINATION",
      message: "That destination is on a private or internal network, so it can't be analyzed.",
      hint: "UIvanta only reads public websites.",
    };
  }

  // Resolve and classify every address the hostname points at.
  let addresses: string[] = [];
  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
    addresses = records.map((r) => r.address);
  } catch {
    return {
      ok: false,
      code: "DNS_FAILURE",
      message: `We couldn't resolve ${url.hostname}.`,
      hint: "Check the spelling of the domain, then try again.",
    };
  }

  if (addresses.length === 0) {
    return {
      ok: false,
      code: "DNS_FAILURE",
      message: `We couldn't resolve ${url.hostname}.`,
    };
  }

  if (addresses.some((address) => isBlockedIp(address))) {
    return {
      ok: false,
      code: "BLOCKED_DESTINATION",
      message: "That hostname resolves to a private or reserved address and was blocked.",
    };
  }

  return { ok: true, url, addresses };
}

export type FetchOutcome =
  | { ok: true; html: string; finalUrl: string; bytes: number; contentType: string; status: number }
  | { ok: false; code: string; message: string; hint?: string };

const MAX_BYTES = 2_500_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 15_000;

export type FetchOptions = {
  accept?: string;
  acceptTest?: RegExp;
  maxBytes?: number;
  timeoutMs?: number;
};

export async function safeFetchHtml(
  input: string,
  userAgent: string,
  options: FetchOptions = {}
): Promise<FetchOutcome> {
  let current: URL;
  const first = await guardUrl(input);
  if (!first.ok) return first;
  current = first.url;

  const maxBytes = options.maxBytes ?? MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const acceptTest = options.acceptTest ?? /text\/html|application\/xhtml\+xml/i;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "user-agent": userAgent,
          accept: options.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "en-US,en;q=0.9",
        },
      });
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      return {
        ok: false,
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? "The website took too long to respond."
          : "We couldn't reach that website.",
        hint: isTimeout ? "Try again, or upload a screenshot instead." : "Check the URL and try again.",
      };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, code: "BAD_REDIRECT", message: "The website returned an incomplete redirect." };
      }
      const next = new URL(location, current);
      const revalidated = await guardUrl(next.toString());
      if (!revalidated.ok) {
        return {
          ok: false,
          code: "BLOCKED_REDIRECT",
          message: "The website redirected to a destination that can't be analyzed.",
        };
      }
      current = revalidated.url;
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: "ACCESS_DENIED",
        message: `The website refused access (HTTP ${response.status}).`,
        hint: "It may require a login or block automated readers. Upload a screenshot instead.",
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "That page returned a 404.",
        hint: "Double-check the path, or try the site's homepage.",
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        code: "UPSTREAM_RATE_LIMIT",
        message: "The website is rate-limiting requests right now.",
        hint: "Wait a moment, then retry.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "UPSTREAM_ERROR",
        message: `The website returned HTTP ${response.status}.`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !acceptTest.test(contentType)) {
      return {
        ok: false,
        code: "NOT_HTML",
        message: "That URL isn't an HTML page, so there's no interface to analyze.",
        hint: "Point UIvanta at a page, not an image, PDF, or API endpoint.",
      };
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength && declaredLength > maxBytes * 3) {
      return { ok: false, code: "TOO_LARGE", message: "That page is too large to analyze." };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return { ok: false, code: "EMPTY_RESPONSE", message: "The website returned an empty response." };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return {
          ok: false,
          code: "TOO_LARGE",
          message: "That page is larger than the 2.5 MB analysis limit.",
        };
      }
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const charset = /charset=([\w-]+)/i.exec(contentType)?.[1]?.toLowerCase();
    let html: string;
    try {
      html = new TextDecoder(charset && charset !== "utf-8" ? charset : "utf-8", {
        fatal: false,
      }).decode(buffer);
    } catch {
      html = buffer.toString("utf8");
    }

    // Re-resolve to catch DNS rebinding between validation and delivery.
    try {
      const recheck = await dns.lookup(current.hostname, { all: true });
      if (recheck.some((r) => isBlockedIp(r.address))) {
        return {
          ok: false,
          code: "BLOCKED_DESTINATION",
          message: "That hostname changed to a private address during the request and was blocked.",
        };
      }
    } catch {
      /* resolution failure after a successful response is not actionable */
    }

    return {
      ok: true,
      html,
      finalUrl: current.toString(),
      bytes: total,
      contentType,
      status: response.status,
    };
  }

  return {
    ok: false,
    code: "TOO_MANY_REDIRECTS",
    message: "The website redirected too many times.",
  };
}

/** Fetch a stylesheet through the same SSRF guard. Returns null when unavailable. */
export async function safeFetchCss(
  input: string,
  userAgent: string,
  maxBytes = 450_000
): Promise<string | null> {
  const result = await safeFetchHtml(input, userAgent, {
    accept: "text/css,*/*;q=0.1",
    acceptTest: /text\/css|text\/plain|application\/x-css/i,
    maxBytes,
    timeoutMs: 8_000,
  });
  return result.ok ? result.html : null;
}
