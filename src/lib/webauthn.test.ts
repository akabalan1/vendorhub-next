import { startAuth, finishAuth } from "./webauthn";

async function compileCheck() {
  const options = await startAuth("user@example.com");
  if (typeof options.challenge !== "string") {
    throw new Error("challenge should be string");
  }
  try {
    await finishAuth("user@example.com", {} as any);
  } catch {
    // Expected failure in test environment
  }
}
compileCheck();
