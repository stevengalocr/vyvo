import assert from "node:assert/strict";
import test from "node:test";
import {
  getBilbildinMode,
  getPrivateBilbildinConfig,
  getPublicBilbildinConfig,
} from "../src/lib/bilbildin/config";

const projectUrl = "https://wgicaiphzwppnshagxve.supabase.co";
const businessId = "14d10531-d6fc-45a9-9c74-1ff15c657099";

test("Bilbildin remains opt-in", () => {
  assert.equal(getBilbildinMode({}), "demo");
  assert.equal(getBilbildinMode({ BILBILDIN_ENABLED: "false" }), "demo");
  assert.equal(getBilbildinMode({ BILBILDIN_ENABLED: "true" }), "bilbildin");
});

test("VYVO-specific business ID takes priority", () => {
  const config = getPublicBilbildinConfig({
    NEXT_PUBLIC_SUPABASE_URL: projectUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test_key_with_safe_length",
    NEXT_PUBLIC_VYVO_BUSINESS_ID: businessId,
    NEXT_PUBLIC_BUSINESS_ID: "287be13a-61a1-4aaa-8049-46a027fd9da1",
  });

  assert.equal(config.businessId, businessId);
});

test("new Supabase key names take priority over legacy names", () => {
  const publicConfig = getPublicBilbildinConfig({
    NEXT_PUBLIC_SUPABASE_URL: projectUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      "sb_publishable_preferred_key_with_safe_length",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_key_with_safe_length",
    NEXT_PUBLIC_VYVO_BUSINESS_ID: businessId,
  });
  const privateConfig = getPrivateBilbildinConfig({
    NEXT_PUBLIC_SUPABASE_URL: projectUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      "sb_publishable_preferred_key_with_safe_length",
    NEXT_PUBLIC_VYVO_BUSINESS_ID: businessId,
    SUPABASE_SECRET_KEY: "sb_secret_preferred_key_with_safe_length",
    SUPABASE_SERVICE_ROLE_KEY: "legacy_service_key_with_safe_length",
  });

  assert.equal(
    publicConfig.publishableKey,
    "sb_publishable_preferred_key_with_safe_length",
  );
  assert.equal(
    privateConfig.secretKey,
    "sb_secret_preferred_key_with_safe_length",
  );
});

test("live configuration fails closed when required values are missing", () => {
  assert.throws(
    () =>
      getPrivateBilbildinConfig({
        BILBILDIN_ENABLED: "true",
        NEXT_PUBLIC_SUPABASE_URL: projectUrl,
      }),
    /configuración pública de Bilbildin incompleta/i,
  );
});
