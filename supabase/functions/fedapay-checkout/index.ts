import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "FEDAPAY_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const environment = Deno.env.get("FEDAPAY_ENVIRONMENT") ?? "live";
    const BASE = environment === "sandbox"
      ? "https://sandbox-api.fedapay.com/v1"
      : "https://api.fedapay.com/v1";

    const apiHeaders = {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/fedapay-checkout\/?/, "");

    // ── POST /initiate — create transaction + return payment URL ──────────────
    if (path === "initiate" && req.method === "POST") {
      const body = await req.json();

      // 1. Create the transaction
      const txRes = await fetch(`${BASE}/transactions`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          description: body.description ?? "Commande en ligne",
          amount: body.amount,
          currency: { iso: "XOF" },
          callback_url: body.callback_url,
          custom_metadata: body.custom_metadata ?? {},
          customer: body.customer,
        }),
      });

      const txData = await txRes.json();

      if (!txRes.ok) {
        return new Response(
          JSON.stringify({ error: "Création de transaction échouée", details: txData }),
          { status: txRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle both flat { id } and nested { v1: { transaction: { id } } } responses
      const transactionId: number | undefined =
        txData?.v1?.transaction?.id ?? txData?.id;

      if (!transactionId) {
        return new Response(
          JSON.stringify({ error: "ID de transaction absent", details: txData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Generate the payment URL/token
      const tokenRes = await fetch(`${BASE}/transactions/${transactionId}/token`, {
        method: "POST",
        headers: apiHeaders,
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        return new Response(
          JSON.stringify({ error: "Génération du lien de paiement échouée", details: tokenData }),
          { status: tokenRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          transaction_id: transactionId,
          token: tokenData?.token,
          url: tokenData?.url,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // ── GET /transactions/:id — check transaction status ─────────────────────
    } else if (path.startsWith("transactions/") && req.method === "GET") {
      const txId = path.replace("transactions/", "");
      const txRes = await fetch(`${BASE}/transactions/${txId}`, { headers: apiHeaders });
      const data = await txRes.json();
      return new Response(JSON.stringify(data), {
        status: txRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(
        JSON.stringify({ error: "Route inconnue: " + path }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
