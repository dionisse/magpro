import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CHARIOW_BASE = "https://api.chariow.com/v1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("CHARIOW_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CHARIOW_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    // /chariow-checkout/initiate  → POST /checkout
    // /chariow-checkout/sales     → GET /sales
    // /chariow-checkout/sale/:id  → GET /sales/:id
    const path = url.pathname.replace(/^\/chariow-checkout\/?/, "");

    const chariowHeaders = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    let chariowRes: Response;

    if (path === "initiate" && req.method === "POST") {
      const body = await req.json();
      chariowRes = await fetch(`${CHARIOW_BASE}/checkout`, {
        method: "POST",
        headers: chariowHeaders,
        body: JSON.stringify(body),
      });
    } else if (path === "sales" && req.method === "GET") {
      chariowRes = await fetch(`${CHARIOW_BASE}/sales`, {
        headers: chariowHeaders,
      });
    } else if (path.startsWith("sales/") && req.method === "GET") {
      const saleId = path.replace("sales/", "");
      chariowRes = await fetch(`${CHARIOW_BASE}/sales/${saleId}`, {
        headers: chariowHeaders,
      });
    } else if (path === "store" && req.method === "GET") {
      chariowRes = await fetch(`${CHARIOW_BASE}/store`, {
        headers: chariowHeaders,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown route: " + path }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await chariowRes.json();
    return new Response(JSON.stringify(data), {
      status: chariowRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
