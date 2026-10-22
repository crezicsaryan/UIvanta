export class AnalysisError extends Error {
  code: string;
  hint?: string;
  retryable: boolean;
  status: number;

  constructor(
    code: string,
    message: string,
    options: { hint?: string; retryable?: boolean; status?: number } = {}
  ) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
    this.hint = options.hint;
    this.retryable = options.retryable ?? false;
    this.status = options.status ?? 400;
  }
}

export const ERROR_COPY: Record<string, { title: string; action?: string }> = {
  INVALID_URL: { title: "That URL doesn't look right", action: "Check the address and try again." },
  EMPTY_URL: { title: "Enter a URL first" },
  UNSUPPORTED_SCHEME: { title: "Unsupported address type" },
  BLOCKED_DESTINATION: { title: "Private network blocked" },
  DNS_FAILURE: { title: "Domain not found" },
  TIMEOUT: { title: "The site timed out", action: "Retry, or upload a screenshot instead." },
  ACCESS_DENIED: { title: "The site refused access", action: "Upload a screenshot instead." },
  NOT_HTML: { title: "Not an HTML page" },
  TOO_LARGE: { title: "Page too large" },
  UPSTREAM_ERROR: { title: "The site returned an error" },
  UPSTREAM_RATE_LIMIT: { title: "The site is rate limiting" },
  RATE_LIMITED: { title: "Too many analyses", action: "Wait a minute, then try again." },
  ANALYSIS_FAILED: { title: "Analysis failed" },
  NOT_FOUND: { title: "Analysis not found" },
  JOB_INCOMPLETE: { title: "Analysis still running" },
  INVALID_IMAGE: { title: "Unsupported image" },
  IMAGE_TOO_LARGE: { title: "Image too large" },
  NO_SIGNAL: { title: "Not enough visual signal" },
};
