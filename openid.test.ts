import { expect, test } from "bun:test";
import * as client from "openid-client";

test("pkce", async () => {
  const base = "https://mockapis.onrender.com";
  const issuer = `${base}/oauth`;
  const config = await client.discovery(new URL(issuer), "irrelevant", "dummy");
  expect(config.serverMetadata().supportsPKCE()).toBe(true);

  const verifier = client.randomPKCECodeVerifier();
  const challenge = await client.calculatePKCECodeChallenge(verifier);
  const state = client.randomState();
  const redirectTo: URL = client.buildAuthorizationUrl(config, {
    redirect_uri: "https://dummy/oauth/callback",
    scope: "openid",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  console.log("Redirect URL search params:", redirectTo.searchParams);
  const result = await fetch(
    `${base}/oauth/_test/authorize${redirectTo.search}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        claims: {
          name: "test user",
          email: "test@example.com",
          email_verified: true,
          sub: "test",
          iss: issuer,
          aud: "irrelevant",
        },
      }),
    }
  ).then((r) => r.json());

  const location = new URL(result.location);
  console.log("Callback search params:", location.searchParams);
  const tokens = await client.authorizationCodeGrant(config, location, {
    pkceCodeVerifier: verifier,
    expectedState: state,
  });
  console.log(tokens);
});
