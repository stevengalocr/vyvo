import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function signature(orderId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`vyvo-order:${orderId}`)
    .digest("base64url");
}

export function createOrderReference(orderId: string, secret: string) {
  if (!uuidPattern.test(orderId) || secret.length < 32) {
    throw new Error("No fue posible crear la referencia del pedido.");
  }
  return `${orderId}.${signature(orderId, secret)}`;
}

export function parseOrderReference(reference: string, secret: string) {
  const [orderId, suppliedSignature, extra] = reference.split(".");
  if (
    extra !== undefined ||
    !orderId ||
    !uuidPattern.test(orderId) ||
    !suppliedSignature ||
    secret.length < 32
  ) {
    return null;
  }

  const expected = Buffer.from(signature(orderId, secret));
  const supplied = Buffer.from(suppliedSignature);
  return supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
    ? orderId
    : null;
}
