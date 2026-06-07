# Guide d'intégration FedaPay — De A à Z

> Rédigé à partir d'une intégration réelle (Supabase Edge Functions + React/Vite).  
> Chaque piège rencontré est documenté avec sa solution.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Prérequis et comptes](#2-prérequis-et-comptes)
3. [Architecture recommandée](#3-architecture-recommandée)
4. [Étape 1 — Créer une transaction](#4-étape-1--créer-une-transaction)
5. [Étape 2 — Générer le lien de paiement](#5-étape-2--générer-le-lien-de-paiement)
6. [Étape 3 — Rediriger le client](#6-étape-3--rediriger-le-client)
7. [Étape 4 — Callback et vérification du statut](#7-étape-4--callback-et-vérification-du-statut)
8. [Paiement sans redirection (Mobile Money direct)](#8-paiement-sans-redirection-mobile-money-direct)
9. [Structure réelle des réponses JSON](#9-structure-réelle-des-réponses-json)
10. [Variables d'environnement](#10-variables-denvironnement)
11. [Implémentation complète : Edge Function Supabase](#11-implémentation-complète--edge-function-supabase)
12. [Implémentation complète : Frontend React](#12-implémentation-complète--frontend-react)
13. [Pièges courants et solutions](#13-pièges-courants-et-solutions)
14. [Checklist de mise en production](#14-checklist-de-mise-en-production)

---

## 1. Vue d'ensemble

FedaPay est une passerelle de paiement africaine supportant :
- Mobile Money (MTN, Moov Bénin/Togo, Orange, Wave…)
- Cartes bancaires (via Checkout)

Le flux standard est :

```
Frontend → Backend → FedaPay API (créer transaction)
                   → FedaPay API (générer token/URL)
                   ← URL de paiement
Frontend ← Backend
Frontend ouvre l'URL FedaPay dans un nouvel onglet
Client paie → FedaPay redirige vers callback_url
Backend vérifie le statut via l'API (ne jamais faire confiance à l'URL callback seule)
```

### Environnements

| Mode     | Base URL API                           | Checkout URL                          |
|----------|----------------------------------------|---------------------------------------|
| Sandbox  | `https://sandbox-api.fedapay.com/v1`   | `https://checkout.fedapay.com`        |
| Live     | `https://api.fedapay.com/v1`           | `https://checkout.fedapay.com`        |

---

## 2. Prérequis et comptes

1. Créer un compte sur [fedapay.com](https://fedapay.com)
2. Dans le dashboard FedaPay → **API Keys** → copier la **Secret Key**
3. Pour les tests, utiliser le compte sandbox avec sa propre clé (distincte de la clé live)
4. Stocker les clés dans des variables d'environnement, jamais dans le code

---

## 3. Architecture recommandée

**Ne jamais appeler l'API FedaPay directement depuis le frontend** — la Secret Key serait exposée.

```
[Frontend React/Vue/etc.]
        │
        │ HTTPS POST (anon key uniquement)
        ▼
[Backend — Edge Function / API Node.js / etc.]
        │
        │ HTTPS + Authorization: Bearer SECRET_KEY
        ▼
[FedaPay API]
```

Pour Supabase, utiliser une Edge Function (Deno). Pour Node.js, un endpoint Express/Fastify.

---

## 4. Étape 1 — Créer une transaction

### Requête

```
POST https://sandbox-api.fedapay.com/v1/transactions
Authorization: Bearer {FEDAPAY_SECRET_KEY}
Content-Type: application/json
```

```json
{
  "description": "Commande #ORD-2026-001",
  "amount": 5000,
  "currency": { "iso": "XOF" },
  "callback_url": "https://monsite.com/merci?order_id=ORD-001",
  "customer": {
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean@example.com",
    "phone_number": {
      "number": "97808080",
      "country": "bj"
    }
  },
  "custom_metadata": {
    "order_id": "uuid-interne",
    "order_number": "ORD-2026-001"
  }
}
```

### Paramètres importants

| Champ            | Obligatoire | Notes                                                                 |
|------------------|-------------|-----------------------------------------------------------------------|
| `description`    | Oui         | Visible par le client sur la page de paiement                         |
| `amount`         | Oui         | Entier, en centimes XOF (pas de décimales)                            |
| `currency.iso`   | Oui         | `"XOF"` pour FCFA                                                     |
| `callback_url`   | Non         | URL de retour après paiement (avec `?id=...&status=...` ajoutés)      |
| `customer.email` | Non         | FedaPay fusionne les clients par email — ne pas dupliquer              |
| `phone_number.country` | Non  | Code pays en **minuscules** (`"bj"`, `"tg"`, `"ci"`, `"sn"`…)        |
| `custom_metadata`| Non         | Objet JSON libre, retourné dans les webhooks — idéal pour l'ID interne|
| `merchant_reference` | Non    | Votre propre référence unique (erreur si dupliquée)                   |

### PIEGE : Format du numéro de téléphone

```
✗ "+22997808080"   → erreur API
✓ "97808080"       → chiffres uniquement, sans indicatif
✓ country: "bj"    → minuscules obligatoires
```

Normaliser côté backend avant d'envoyer :
```typescript
number: String(phone).replace(/\D/g, ""),  // retire tout sauf les chiffres
country: String(country).toLowerCase()
```

### Réponse

```json
{
  "v1/transaction": {
    "klass": "v1/transaction",
    "id": 111339662,
    "reference": "T_localKRVMGR8892",
    "amount": 5000,
    "description": "Commande #ORD-2026-001",
    "status": "pending",
    "currency_id": 5,
    "mode": "live",
    "created_at": "2026-06-07T07:24:25.000Z"
  }
}
```

**PIEGE MAJEUR** : La réponse n'est PAS plate. L'ID est dans `response["v1/transaction"]["id"]`, pas dans `response["id"]`. La documentation officielle montre une version simplifiée qui ne correspond pas à la réalité.

```typescript
// Extraction correcte de l'ID
const d = response as Record<string, unknown>;
const txObj = (d?.["v1/transaction"] as Record<string, unknown>) ?? d;
const txId = txObj?.["id"] as number;
```

---

## 5. Étape 2 — Générer le lien de paiement

### Requête

```
POST https://sandbox-api.fedapay.com/v1/transactions/{id}/token
Authorization: Bearer {FEDAPAY_SECRET_KEY}
Content-Type: application/json
```

Pas de corps. Juste l'ID de la transaction dans l'URL.

### Réponse possible (deux formats observés)

**Format nested (v1) :**
```json
{
  "v1/token": {
    "klass": "v1/token",
    "token": "wNxxxxxxxxxxxxxxxxxxxxxx",
    "url": "https://checkout.fedapay.com/payment?token=wNxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

**Format plat (selon version API) :**
```json
{
  "token": "wNxxxxxxxxxxxxxxxxxxxxxx",
  "url": "https://checkout.fedapay.com/payment?token=wNxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Extraction robuste gérant les deux formats :**
```typescript
const td = tokenResponse as Record<string, unknown>;
const nested = td?.["v1/token"] as Record<string, unknown> | undefined;
const tokenVal = (nested?.["token"] ?? td?.["token"]) as string | undefined;
const paymentUrl = (nested?.["url"] ?? td?.["url"]) as string | undefined;

// Fallback : construire l'URL manuellement si absent
const finalUrl = paymentUrl ?? `https://checkout.fedapay.com/payment?token=${tokenVal}`;
```

---

## 6. Étape 3 — Rediriger le client

### PIEGE CRITIQUE : `window.location.href` vs `window.open`

Dans certains environnements (WebContainers Bolt, iframes, service workers restrictifs), `window.location.href = fedaPayUrl` est **intercepté et bloqué**. La transaction est créée côté FedaPay mais le client ne voit jamais la page de paiement.

**Solution universelle : ouvrir dans un nouvel onglet**

```typescript
// ✗ Peut être bloqué dans les environnements iframe/service worker
window.location.href = paymentUrl;

// ✓ Fonctionne partout
window.open(paymentUrl, '_blank');
```

En production sur un domaine propre, `window.location.href` fonctionne. Mais `window.open` est plus robuste et fonctionne dans tous les cas.

---

## 7. Étape 4 — Callback et vérification du statut

### URL de callback

FedaPay redirige le client vers `callback_url?id={transaction_id}&status={status}`.

Statuts possibles :
- `approved` — paiement réussi
- `declined` — refusé par le client
- `canceled` — annulé (fonds insuffisants, timeout)
- `pending` — en attente (ne pas valider la commande)

### IMPORTANT : Toujours vérifier via l'API

Ne jamais faire confiance au statut dans l'URL (facilement falsifiable). Toujours confirmer :

```
GET https://api.fedapay.com/v1/transactions/{id}
Authorization: Bearer {FEDAPAY_SECRET_KEY}
```

```typescript
// Dans le callback handler
const urlStatus = searchParams.get('status');   // NE PAS faire confiance
const txId = searchParams.get('id');

// Vérifier auprès de l'API
const res = await fetch(`${BASE}/transactions/${txId}`, {
  headers: { Authorization: `Bearer ${secretKey}` }
});
const data = await res.json();
const realStatus = data?.["v1/transaction"]?.["status"]; // "approved", "declined", etc.

if (realStatus === 'approved') {
  // Valider la commande dans votre base de données
}
```

---

## 8. Paiement sans redirection (Mobile Money direct)

Pour MTN Bénin, Moov Bénin, Moov Togo, MTN Côte d'Ivoire — le client reste sur votre site.

### Flux

1. Créer la transaction (étape 1) → récupérer le `token`
2. Déclencher le paiement mobile directement

```
POST https://sandbox-api.fedapay.com/v1/{methode_paiement}
Authorization: Bearer {FEDAPAY_SECRET_KEY}
Content-Type: application/json
```

```json
{
  "token": "TOKEN_DE_PAIEMENT",
  "phone_number": {
    "number": "97808080",
    "country": "bj"
  }
}
```

Méthodes disponibles (`methode_paiement`) :
- `mtn_benin`
- `moov_benin`
- `moov_togo`
- `mtn_ci` (Côte d'Ivoire)

Ensuite, poller le statut de la transaction jusqu'à `approved` ou `declined`.

---

## 9. Structure réelle des réponses JSON

La documentation officielle simplifie les réponses. Voici la structure réelle :

### Transaction créée

```json
{
  "v1/transaction": {
    "klass": "v1/transaction",
    "id": 111339662,
    "reference": "T_localKRVMGR8892",
    "amount": 5000,
    "description": "...",
    "status": "pending",
    "currency_id": 5,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Token généré

```json
{
  "v1/token": {
    "klass": "v1/token",
    "token": "wNxxxxxx",
    "url": "https://checkout.fedapay.com/payment?token=wNxxxxxx"
  }
}
```

### Pattern d'extraction universel

```typescript
function extractFromResponse(response: unknown, resourceName: string): Record<string, unknown> {
  const d = response as Record<string, unknown>;
  return (
    (d?.[`v1/${resourceName}`] as Record<string, unknown>) ??
    (d?.[resourceName] as Record<string, unknown>) ??
    d
  );
}

const txObj = extractFromResponse(txResponse, "transaction");
const txId = txObj["id"] as number;
```

---

## 10. Variables d'environnement

```env
# Clé secrète FedaPay (sandbox ou live selon l'environnement)
FEDAPAY_SECRET_KEY=sk_sandbox_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# "sandbox" ou "live"
FEDAPAY_ENVIRONMENT=sandbox
```

Pour Supabase Edge Functions, définir ces secrets via le dashboard Supabase :
**Settings → Edge Functions → Secrets** (ou via le MCP `list_edge_function_secrets`).

**Ne jamais exposer `FEDAPAY_SECRET_KEY` côté frontend.**

---

## 11. Implémentation complète : Edge Function Supabase

Fichier : `supabase/functions/fedapay-checkout/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function safeJson(res: Response) {
  const raw = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw), raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw: raw.slice(0, 800) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const secretKey = Deno.env.get("FEDAPAY_SECRET_KEY");
    if (!secretKey) return json({ error: "FEDAPAY_SECRET_KEY non configuré" }, 500);

    const environment = (Deno.env.get("FEDAPAY_ENVIRONMENT") ?? "live").trim();
    const BASE = environment === "sandbox"
      ? "https://sandbox-api.fedapay.com/v1"
      : "https://api.fedapay.com/v1";

    const apiHeaders = {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    const path = new URL(req.url).pathname.replace(/^\/fedapay-checkout\/?/, "");

    // POST /initiate — créer transaction + générer URL
    if (path === "initiate" && req.method === "POST") {
      const body = await req.json() as Record<string, unknown>;

      // Normaliser le téléphone
      const cust = (body.customer ?? {}) as Record<string, unknown>;
      const ph = (cust.phone_number ?? {}) as Record<string, unknown>;
      const customer = {
        ...cust,
        phone_number: ph.number ? {
          number: String(ph.number).replace(/\D/g, ""),
          country: String(ph.country ?? "bj").toLowerCase(),
        } : undefined,
      };

      // 1. Créer la transaction
      const txFetch = await fetch(`${BASE}/transactions`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          description: body.description ?? "Commande en ligne",
          amount: Number(body.amount),
          currency: { iso: "XOF" },
          callback_url: body.callback_url,
          custom_metadata: body.custom_metadata ?? {},
          customer,
        }),
      });

      const tx = await safeJson(txFetch);
      if (!tx.ok) {
        return json({ error: "FedaPay: création de transaction échouée", details: tx.data }, tx.status >= 400 ? tx.status : 502);
      }

      // Extraire l'ID (réponse nestée sous "v1/transaction")
      const d = tx.data as Record<string, unknown>;
      const txObj = (d?.["v1/transaction"] as Record<string, unknown>) ?? d;
      const txId = txObj?.["id"] as number | undefined;
      if (!txId) {
        return json({ error: `FedaPay: ID introuvable. Structure: ${JSON.stringify(tx.data).slice(0, 600)}` }, 500);
      }

      // 2. Générer le token de paiement
      const tokenFetch = await fetch(`${BASE}/transactions/${txId}/token`, {
        method: "POST",
        headers: apiHeaders,
      });

      const tok = await safeJson(tokenFetch);
      if (!tok.ok) {
        return json({ error: "FedaPay: génération du lien échouée", details: tok.data }, tok.status >= 400 ? tok.status : 502);
      }

      // Extraire token et URL (gère format nested et plat)
      const td = tok.data as Record<string, unknown>;
      const nested = td?.["v1/token"] as Record<string, unknown> | undefined;
      const tokenVal = (nested?.["token"] ?? td?.["token"]) as string | undefined;
      const paymentUrl = (nested?.["url"] ?? td?.["url"]) as string | undefined;

      if (!paymentUrl && !tokenVal) {
        return json({ error: `FedaPay: token absent. Réponse: ${JSON.stringify(td).slice(0, 400)}` }, 500);
      }

      const finalUrl = paymentUrl ?? `https://checkout.fedapay.com/payment?token=${tokenVal}`;
      return json({ transaction_id: txId, token: tokenVal, url: finalUrl });
    }

    // GET /transactions/:id — vérifier le statut
    if (path.startsWith("transactions/") && req.method === "GET") {
      const txId = path.replace("transactions/", "");
      const r = await fetch(`${BASE}/transactions/${txId}`, { headers: apiHeaders });
      const { data, raw, status } = await safeJson(r);
      return json(data ?? { raw }, status);
    }

    return json({ error: "Route inconnue: " + path }, 404);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
```

---

## 12. Implémentation complète : Frontend React

```typescript
// Dans votre handler de soumission de commande
async function handleFedaPayCheckout(order: Order, cartItems: CartItem[]) {
  const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fedapay-checkout`;
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${EDGE_URL}/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token}`,
      "Apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      description: `Commande ${order.order_number}`,
      amount: order.total_amount,
      callback_url: `${window.location.origin}/commandes?order_id=${order.id}`,
      customer: {
        firstname: order.customer_name.split(" ")[0],
        lastname: order.customer_name.split(" ").slice(1).join(" "),
        email: user.email,
        phone_number: { number: order.customer_phone, country: "bj" },
      },
      custom_metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }

  const data = await res.json();
  const paymentUrl: string | undefined = data?.url;

  if (!paymentUrl) {
    throw new Error(`URL de paiement absente. Réponse: ${JSON.stringify(data)}`);
  }

  // IMPORTANT : utiliser window.open pour éviter les blocages service worker
  window.open(paymentUrl, '_blank');
}

// Sur la page callback (après retour de FedaPay)
async function verifyPayment(transactionId: string) {
  const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fedapay-checkout`;
  const res = await fetch(`${EDGE_URL}/transactions/${transactionId}`, {
    headers: { "Apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
  });
  const data = await res.json();
  const txObj = data?.["v1/transaction"] ?? data;
  return txObj?.status as "approved" | "declined" | "canceled" | "pending";
}
```

---

## 13. Pièges courants et solutions

### 1. Réponse JSON nestée (`v1/transaction`, `v1/token`)

**Symptôme** : `transaction.id` est `undefined`, ID non trouvé.  
**Cause** : La vraie réponse API est `{ "v1/transaction": { "id": 123 } }`, pas `{ "id": 123 }`.  
**Solution** : Toujours lire depuis `response["v1/transaction"]` avec fallback.

---

### 2. Redirection bloquée par le service worker

**Symptôme** : Transaction créée dans FedaPay (visible dans le dashboard) mais le client reste sur votre site avec une erreur.  
**Cause** : `window.location.href` est intercepté dans certains environnements (Bolt WebContainers, iframes).  
**Solution** : Utiliser `window.open(url, '_blank')`.

---

### 3. Numéro de téléphone invalide

**Symptôme** : Erreur `422` ou `400` de l'API FedaPay avec message sur le champ `phone_number`.  
**Cause** : Format `"+22997808080"` ou pays en majuscules `"BJ"`.  
**Solution** :
```typescript
number: phone.replace(/\D/g, ""),    // "97808080"
country: countryCode.toLowerCase()   // "bj"
```

---

### 4. Email client dupliqué

**Symptôme** : Erreur à la création de la transaction.  
**Cause** : FedaPay fusionne les clients par email. Envoyer le même email avec des données différentes met à jour le client, mais en cas de conflit ça peut échouer.  
**Solution** : Utiliser des emails cohérents et uniques par client.

---

### 5. Ne jamais faire confiance au `status` de l'URL callback

**Symptôme** : Des commandes validées même si le paiement a échoué.  
**Cause** : N'importe qui peut forger `?status=approved` dans l'URL.  
**Solution** : Toujours vérifier via `GET /v1/transactions/{id}` côté serveur.

---

### 6. Clé sandbox vs live

**Symptôme** : Erreur `401 Unauthorized`.  
**Cause** : Utiliser la clé sandbox avec l'URL live ou inversement.  
**Solution** :
- Sandbox : `sk_sandbox_xxx` → `https://sandbox-api.fedapay.com/v1`
- Live : `sk_live_xxx` → `https://api.fedapay.com/v1`

---

### 7. `merchant_reference` dupliqué

**Symptôme** : Erreur à la création si vous utilisez `merchant_reference`.  
**Cause** : FedaPay exige l'unicité de cette référence.  
**Solution** : Utiliser un UUID ou un timestamp unique par transaction.

---

## 14. Checklist de mise en production

- [ ] Remplacer la clé sandbox par la clé live dans les secrets
- [ ] Remplacer `FEDAPAY_ENVIRONMENT=sandbox` par `FEDAPAY_ENVIRONMENT=live`
- [ ] Vérifier que `callback_url` pointe vers votre domaine de production
- [ ] Implémenter la vérification du statut côté serveur (ne pas faire confiance à l'URL)
- [ ] Tester un vrai paiement Mobile Money en live (montant minimal : 100 XOF)
- [ ] Mettre en place un webhook FedaPay pour les paiements asynchrones
- [ ] Logger toutes les transactions côté base de données
- [ ] Gérer les timeouts (une transaction `pending` expire après 24h)

---

## Ressources

- Documentation officielle : https://docs.fedapay.com
- API Reference : https://docs.fedapay.com/api-reference/transactions/create-token
- Dashboard Sandbox : https://sandbox.fedapay.com
- Dashboard Live : https://dashboard.fedapay.com
