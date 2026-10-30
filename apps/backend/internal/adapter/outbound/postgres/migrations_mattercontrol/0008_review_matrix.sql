-- +goose Up
-- Manual document review matrix: a grid of exact document versions (rows) and versioned questions
-- (columns) with append-only human answers. It never touches verification, execution, dependency
-- or filing state. Composite foreign keys make a version or question of another matter, or of
-- another grid, structurally impossible.

CREATE TABLE review_grids (
    id         UUID PRIMARY KEY,
    matter_id  UUID NOT NULL REFERENCES matters,
    name       TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
    created_by UUID NOT NULL REFERENCES users,
    created_at TIMESTAMPTZ NOT NULL,
    revision   BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, id)
);

CREATE TABLE review_grid_versions (
    grid_id    UUID NOT NULL,
    matter_id  UUID NOT NULL,
    version_id UUID NOT NULL,
    position   INT NOT NULL,
    PRIMARY KEY (grid_id, version_id),
    FOREIGN KEY (matter_id, grid_id) REFERENCES review_grids (matter_id, id),
    FOREIGN KEY (matter_id, version_id) REFERENCES document_versions (matter_id, id)
);

CREATE TABLE review_questions (
    id         UUID PRIMARY KEY,
    matter_id  UUID NOT NULL,
    grid_id    UUID NOT NULL,
    position   INT NOT NULL,
    revision   INT NOT NULL CHECK (revision >= 1),
    text       TEXT NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 1000),
    revised_by UUID NOT NULL REFERENCES users,
    revised_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (matter_id, grid_id) REFERENCES review_grids (matter_id, id),
    UNIQUE (matter_id, id),
    UNIQUE (grid_id, id)
);

CREATE TABLE review_question_revisions (
    question_id UUID NOT NULL REFERENCES review_questions (id),
    revision    INT NOT NULL,
    text        TEXT NOT NULL,
    revised_by  UUID NOT NULL REFERENCES users,
    revised_at  TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (question_id, revision)
);

CREATE TABLE review_answers (
    id                UUID PRIMARY KEY,
    matter_id         UUID NOT NULL,
    grid_id           UUID NOT NULL,
    version_id        UUID NOT NULL,
    question_id       UUID NOT NULL,
    question_revision INT NOT NULL,
    state             TEXT NOT NULL CHECK (state IN ('REVIEWED', 'ABSENT', 'UNABLE')),
    text              TEXT NOT NULL DEFAULT '' CHECK (length(text) <= 4000),
    page_ref          TEXT NOT NULL DEFAULT '' CHECK (length(page_ref) <= 40),
    quote_ref         TEXT NOT NULL DEFAULT '' CHECK (length(quote_ref) <= 1000),
    author            UUID NOT NULL REFERENCES users,
    answered_at       TIMESTAMPTZ NOT NULL,
    supersedes_id     UUID REFERENCES review_answers (id),
    FOREIGN KEY (matter_id, grid_id) REFERENCES review_grids (matter_id, id),
    FOREIGN KEY (matter_id, version_id) REFERENCES document_versions (matter_id, id),
    FOREIGN KEY (grid_id, question_id) REFERENCES review_questions (grid_id, id),
    UNIQUE (supersedes_id)
);

CREATE INDEX review_answers_cell ON review_answers (grid_id, version_id, question_id, id);

-- +goose Down
DROP TABLE IF EXISTS review_answers;
DROP TABLE IF EXISTS review_question_revisions;
DROP TABLE IF EXISTS review_questions;
DROP TABLE IF EXISTS review_grid_versions;
DROP TABLE IF EXISTS review_grids;
