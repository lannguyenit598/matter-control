-- name: SearchMetadataPage :one
WITH permitted_workspaces AS MATERIALIZED (
 SELECT w.id,w.name,wm.role FROM workspaces w JOIN workspace_memberships wm ON wm.workspace_id=w.id
 WHERE wm.user_id=sqlc.arg(actor)::uuid AND wm.status='ACTIVE'
), permitted_matters AS MATERIALIZED (
 SELECT m.id,m.title,m.workspace_id,w.name AS workspace_name,mm.role
 FROM matters m JOIN permitted_workspaces w ON w.id=m.workspace_id
 JOIN matter_memberships mm ON mm.matter_id=m.id AND mm.user_id=sqlc.arg(actor)::uuid AND mm.status='ACTIVE'
), projection AS (
 SELECT 'WORKSPACE'::text AS kind,w.id::text AS id,w.name AS label,w.id::text AS workspace_id,w.name AS workspace_name,''::text AS matter_id,''::text AS matter_title,w.role,''::text AS outcome,''::text AS execution,''::text AS due_at,0::int AS version,''::text AS uploaded_at
 FROM permitted_workspaces w WHERE sqlc.arg(group_name)::text='workspaces'
 UNION ALL
 SELECT 'MATTER',m.id::text,m.title,m.workspace_id::text,m.workspace_name,m.id::text,m.title,m.role,'','','',0,'' FROM permitted_matters m WHERE sqlc.arg(group_name)::text='matters'
 UNION ALL
 SELECT CASE WHEN f.item_id IS NULL THEN 'ACTION' ELSE 'FILING' END,a.id::text,a.title,m.workspace_id::text,m.workspace_name,m.id::text,m.title,m.role,left(a.outcome,160),a.execution_state,coalesce(to_char(a.due_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),''),0,''
 FROM actions a JOIN permitted_matters m ON m.id=a.matter_id LEFT JOIN filing_details f ON f.matter_id=a.matter_id AND f.item_id=a.id WHERE sqlc.arg(group_name)::text='workItems'
 UNION ALL
 SELECT 'REQUIREMENT',a.id::text,a.title,m.workspace_id::text,m.workspace_name,m.id::text,m.title,m.role,left(a.outcome,160),a.execution_state,coalesce(to_char(a.due_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),''),0,''
 FROM requirements a JOIN permitted_matters m ON m.id=a.matter_id WHERE sqlc.arg(group_name)::text='workItems'
 UNION ALL
 SELECT 'DOCUMENT',d.id::text,d.name,m.workspace_id::text,m.workspace_name,m.id::text,m.title,m.role,'','','',coalesce(v.version_no,0),coalesce(to_char(v.uploaded_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'')
 FROM documents d JOIN permitted_matters m ON m.id=d.matter_id LEFT JOIN document_versions v ON v.matter_id=d.matter_id AND v.id=d.current_version_id WHERE sqlc.arg(group_name)::text='documents'
), matching AS MATERIALIZED (
 SELECT p.*,mc_search_key_v1(label) COLLATE "C" AS label_key,
 CASE WHEN mc_search_key_v1(label)=mc_search_key_v1(sqlc.arg(query)::text) THEN 0 WHEN starts_with(mc_search_key_v1(label),mc_search_key_v1(sqlc.arg(query)::text)) THEN 1 ELSE 2 END AS rank,
 CASE WHEN matter_id=sqlc.arg(matter_hint)::text THEN 0 ELSE 1 END AS boost
 FROM projection p WHERE mc_search_key_v1(sqlc.arg(query)::text)<>'' AND strpos(mc_search_key_v1(label),mc_search_key_v1(sqlc.arg(query)::text))>0
), canonical AS (
 SELECT kind,id,(SELECT string_agg(octet_length(cell)::text || ':' || cell,'' ORDER BY ordinal)
 FROM unnest(ARRAY[kind,id,label,workspace_id,workspace_name,matter_id,matter_title,role,outcome,execution,due_at,version::text,uploaded_at,label_key,rank::text,boost::text]) WITH ORDINALITY AS c(cell,ordinal)) AS cells FROM matching
), digest AS (
 SELECT encode(sha256(convert_to(coalesce(string_agg(cells,'' ORDER BY kind COLLATE "C",id COLLATE "C"),''),'UTF8')),'hex') AS fingerprint FROM canonical
), ranked AS MATERIALIZED (
 SELECT m.*,count(*) OVER (PARTITION BY kind,matter_id,label COLLATE "C")>1 AS same_name,row_number() OVER (ORDER BY rank,boost,label_key COLLATE "C",kind COLLATE "C",id COLLATE "C") AS position FROM matching m
), anchor AS (
 SELECT position FROM ranked WHERE kind=sqlc.arg(anchor_kind)::text AND id=sqlc.arg(anchor_id)::text
), page AS (
 SELECT * FROM ranked WHERE (sqlc.arg(anchor_id)::text='' OR position>(SELECT position FROM anchor)) ORDER BY position LIMIT sqlc.arg(page_limit)::bigint
)
SELECT (SELECT fingerprint FROM digest)::text AS fingerprint,
 (sqlc.arg(anchor_id)::text='' OR EXISTS(SELECT 1 FROM anchor))::boolean AS anchor_found,
 coalesce((SELECT jsonb_agg(jsonb_build_object('sameName',same_name,'id',id,'kind',kind,'label',label,'workspaceId',workspace_id,'workspaceName',workspace_name,'matterId',matter_id,'matterTitle',matter_title,'role',role,'outcome',outcome,'execution',execution,'dueAt',due_at,'version',version,'uploadedAt',uploaded_at) ORDER BY position)::text FROM page),'[]')::text AS payload,
 (mc_search_key_v1(sqlc.arg(query)::text)<>'')::boolean AS query_valid;
