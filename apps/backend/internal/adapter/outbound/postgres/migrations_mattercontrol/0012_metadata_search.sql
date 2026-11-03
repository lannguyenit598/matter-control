-- +goose Up
-- EN/VI metadata comparison profile; display text and legal rows remain unchanged.
CREATE COLLATION mc_search_root_v1 (provider = icu, locale = 'und', deterministic = true);
-- +goose StatementBegin
CREATE FUNCTION mc_search_key_v1(value text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
 SELECT lower(translate(regexp_replace(normalize(value, NFD), '[̀-ͯ]', '', 'g'), 'Đđ', 'Dd') COLLATE mc_search_root_v1);
$$;
-- +goose StatementEnd
-- +goose Down
DROP FUNCTION mc_search_key_v1(text);
DROP COLLATION mc_search_root_v1;
