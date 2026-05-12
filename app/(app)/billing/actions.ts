"use server";

import { redirect } from "next/navigation";

import {
  ApiError,
  createCheckoutSession,
  createPortalSession,
  humanizeDetail,
} from "@/lib/api";

function appBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export async function startCheckoutAction(
  priceId: string,
): Promise<{ error: string } | void> {
  const pid = priceId.trim();
  if (!pid) {
    return {
      error:
        "Missing Stripe price ID. Set NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID or NEXT_PUBLIC_STRIPE_PRO_PRICE_ID in .env.local.",
    };
  }
  const base = appBaseUrl();
  let checkout: { checkout_url: string };
  try {
    checkout = await createCheckoutSession({
      price_id: pid,
      success_url: `${base}/billing?success=true`,
      cancel_url: `${base}/billing?cancelled=true`,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof ApiError
        ? humanizeDetail(err.detail) ?? err.message
        : err instanceof Error
          ? err.message
          : "Could not start checkout";
    return { error: msg };
  }
  redirect(checkout.checkout_url);
}

export async function openPortalAction(): Promise<{ error: string } | void> {
  const base = appBaseUrl();
  let portal: { portal_url: string };
  try {
    portal = await createPortalSession({
      return_url: `${base}/billing`,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof ApiError
        ? humanizeDetail(err.detail) ?? err.message
        : err instanceof Error
          ? err.message
          : "Could not open billing portal";
    return { error: msg };
  }
  redirect(portal.portal_url);
}
