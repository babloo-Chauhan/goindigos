/** Test-only values for the Playwright admin server. These are not real credentials. */
export const ADMIN_E2E = {
  port: 3107,
  username: "e2e-admin",
  password: "e2e-test-password-only",
  uri: process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017",
  database: "aerocareer_e2e",
  get env() {
    return {
      ADMIN_USERNAME: this.username,
      ADMIN_PASSWORD: this.password,
      ADMIN_SESSION_SECRET: "e2e-test-secret-only-e2e-test-secret-only",
      MONGODB_URI: this.uri,
      MONGODB_DB: this.database,
    };
  },
};
