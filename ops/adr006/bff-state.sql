-- Apply only to the approved BFF database/schema with a separate migration identity.
-- No users, passwords or broad runtime grants are created by this schema migration.
CREATE SCHEMA IF NOT EXISTS mc_bff;
REVOKE ALL ON SCHEMA mc_bff FROM PUBLIC;
CREATE TABLE IF NOT EXISTS mc_bff.state (
    state_key text PRIMARY KEY,
    sealed bytea NOT NULL,
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS bff_state_expiry ON mc_bff.state (expires_at);
-- The dedicated BFF login role needs USAGE on mc_bff and SELECT/INSERT/UPDATE/DELETE
-- on mc_bff.state only; no ownership, schema CREATE, application tables or Data API grants.
-- Expired rows cannot be read. Physical cleanup/retention is a separate bounded operator job.
