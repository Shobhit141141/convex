const UPSTREAM_ORIGIN = "https://convex-rosy.vercel.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, UPSTREAM_ORIGIN);

    const forwardHeaders = new Headers();
    const contentType = request.headers.get("content-type");
    const accept = request.headers.get("accept");
    if (contentType) forwardHeaders.set("content-type", contentType);
    if (accept) forwardHeaders.set("accept", accept);
    forwardHeaders.set("user-agent", "Convex-Cloudflare-Edge-Worker/1.0");

    const init = {
      method: request.method,
      headers: forwardHeaders,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : undefined,
      redirect: "follow"
    };

    const response = await fetch(targetUrl.toString(), init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.set("X-Edge-Runtime", "cloudflare-workers");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};
