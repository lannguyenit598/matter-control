"""Synthetic local PostgreSQL tooling drill; never connects to an existing DB."""
import datetime
import hashlib
import json
import pathlib
import subprocess
import sys
import time
import uuid

ENDPOINT = "unix:///Users/nguyenvanlan/.docker/run/docker.sock"
IMAGE = "postgres:18.6-alpine"
FIXTURE = """
CREATE SCHEMA drill;
CREATE TABLE drill.records(id serial PRIMARY KEY, label text UNIQUE NOT NULL,
 amount integer NOT NULL CHECK(amount>=0));
CREATE TABLE drill.links(id integer PRIMARY KEY, record_id integer REFERENCES drill.records(id));
INSERT INTO drill.records(label,amount) SELECT 'synthetic-'||i,i*7 FROM generate_series(1,100) i;
INSERT INTO drill.links SELECT i,i FROM generate_series(1,100) i;
CREATE TABLE drill.markers(name text PRIMARY KEY);
INSERT INTO drill.markers VALUES ('pre_backup');
"""
CHECK = """
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM drill.records)<>100 OR
 (SELECT sum(amount) FROM drill.records)<>35350 OR
 (SELECT count(*) FROM drill.links)<>100 OR
 (SELECT count(*) FROM drill.markers)<>1 OR
 NOT EXISTS(SELECT 1 FROM drill.markers WHERE name='pre_backup') OR
 EXISTS(SELECT 1 FROM drill.markers WHERE name='post_backup') THEN
 RAISE EXCEPTION 'restored contents mismatch'; END IF;
END $$;
SELECT md5(string_agg(id||':'||label||':'||amount,',' ORDER BY id)) FROM drill.records;
INSERT INTO drill.records(label,amount) VALUES ('sequence-check',0) RETURNING id;
ROLLBACK;
"""


def main():
    out = pathlib.Path(sys.argv[1])
    out.mkdir(exist_ok=False, parents=True)
    token = uuid.uuid4().hex[:12]
    report = {"started_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "task": "MC-002", "scope": "synthetic PostgreSQL tooling only",
              "endpoint": ENDPOINT, "token": token, "commands": [], "containers": [],
              "status": "FAILED", "backup_cadence": "one manual dump; not scheduled",
              "product_restore": "NOT_RUN", "production_rpo_rto": "UNVERIFIED"}
    owned = []
    started = time.monotonic()

    def run(args, data=None, expected=0):
        cmd = ["rtk", "proxy", "docker", "--host", ENDPOINT, *args]
        t = time.monotonic()
        p = subprocess.run(cmd, input=data, capture_output=True, timeout=180)
        n = len(report["commands"])
        (out / f"{n:02d}.stdout").write_bytes(p.stdout)
        (out / f"{n:02d}.stderr").write_bytes(p.stderr)
        report["commands"].append({"argv": cmd, "exit": p.returncode,
                                   "elapsed_seconds": time.monotonic()-t,
                                   "stdout": f"{n:02d}.stdout", "stderr": f"{n:02d}.stderr"})
        if expected == "nonzero":
            assert p.returncode != 0, "negative check unexpectedly succeeded"
        elif expected != "any":
            assert p.returncode == expected, f"command failed: {args}; {p.stderr.decode(errors='replace')}"
        return p.stdout

    def sql(cid, db, text, expected=0):
        return run(["exec", "-i", cid, "psql", "-U", "postgres", "-d", db,
                    "-v", "ON_ERROR_STOP=1", "-At"], text.encode(), expected)

    def create(role, digest):
        name = f"mc021-{token}-{role}"
        # A pre-existing exact name must fail creation; Docker never reuses it.
        cid = run(["create", "--name", name, "--label", f"mc021.drill={token}",
                   "--network", "none", "--memory", "256m", "--cpus", "1",
                   "--tmpfs", "/var/lib/postgresql:rw,size=256m",
                   "-e", "POSTGRES_HOST_AUTH_METHOD=trust", digest]).decode().strip()
        owned.append(cid)
        info = json.loads(run(["inspect", cid]))[0]
        assert info["Config"]["Labels"]["mc021.drill"] == token
        assert info["HostConfig"]["NetworkMode"] == "none"
        assert not info["Mounts"], "unexpected volume or bind mount"
        assert "/var/lib/postgresql" in info["HostConfig"]["Tmpfs"]
        report["containers"].append({"role": role, "name": name, "id": cid,
                                     "network": "none", "volumes": [], "tmpfs": True})
        run(["start", cid])
        deadline = time.monotonic()+45
        # postgres logs announce final startup; pg_isready can briefly see its init server.
        while True:
            run(["exec", cid, "sh", "-c",
                 'test "$(head -n 1 "$PGDATA/postmaster.pid")" = 1 && pg_isready -U postgres'],
                expected="any")
            if report["commands"][-1]["exit"] == 0:
                run(["exec", cid, "pg_isready", "-U", "postgres"])
                break
            assert time.monotonic() < deadline, "PostgreSQL startup timeout"
            time.sleep(.25)
        run(["exec", cid, "createdb", "-U", "postgres", f"mc021_{role}"])
        return cid

    try:
        run(["version", "--format", "{{json .}}"])
        run(["pull", IMAGE])
        image = json.loads(run(["image", "inspect", IMAGE]))[0]
        digest = next(d for d in image["RepoDigests"] if d.startswith("postgres@sha256:"))
        report["image"] = {"tag": IMAGE, "digest": digest, "id": image["Id"]}
        source = create("source", digest)
        (out / "fixture.sql").write_text(FIXTURE)
        (out / "checks.sql").write_text(CHECK)
        sql(source, "mc021_source", FIXTURE)
        baseline = sql(source, "mc021_source", "SELECT md5(string_agg(id||':'||label||':'||amount,',' ORDER BY id)) FROM drill.records;").strip()
        backup_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        archive = run(["exec", source, "pg_dump", "-U", "postgres", "-d", "mc021_source",
                       "--format=custom", "--no-owner", "--no-acl"])
        assert archive.startswith(b"PGDMP") and len(archive)>100
        (out / "synthetic.dump").write_bytes(archive)
        report["archive"] = {"sha256": hashlib.sha256(archive).hexdigest(),
                              "bytes": len(archive), "backup_point_utc": backup_at}
        sql(source, "mc021_source", "INSERT INTO drill.markers VALUES ('post_backup');")
        run(["exec", "-i", source, "pg_restore", "--list"], archive)
        run(["exec", "-i", source, "pg_restore", "--list"], b"deliberately corrupt synthetic COPY", "nonzero")
        recovery_start = time.monotonic()
        target = create("restore", digest)
        assert sql(target, "mc021_restore", "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');").strip() == b"0"
        restore_start = time.monotonic()
        run(["exec", "-i", target, "pg_restore", "-U", "postgres", "-d", "mc021_restore",
             "--single-transaction", "--exit-on-error", "--no-owner", "--no-acl"], archive)
        report["restore_only_seconds"] = time.monotonic()-restore_start
        checked = sql(target, "mc021_restore", CHECK).decode()
        assert baseline.decode() in checked.splitlines() and "101" in checked.splitlines()
        assert sql(target, "mc021_restore", "SELECT count(*) FROM drill.records;").strip() == b"100"
        for statement in ["INSERT INTO drill.links VALUES (999,999);",
                          "INSERT INTO drill.records(label,amount) VALUES ('bad',-1);",
                          "INSERT INTO drill.records(id,label,amount) VALUES (1,'duplicate',0);"]:
            sql(target, "mc021_restore", "BEGIN;"+statement+"ROLLBACK;", "nonzero")
        assert sql(source, "mc021_source", "SELECT count(*) FROM drill.markers;").strip() == b"2"
        report["recovery_to_validated_read_seconds"] = time.monotonic()-recovery_start
        report["assertions"] = {"rows": 100, "sum": 35350, "links": 100,
                                 "content_md5": baseline.decode(), "sequence_next": 101,
                                 "pre_backup_restored": True, "post_backup_omitted": True,
                                 "corrupt_copy_rejected": True, "pk_fk_check_rejected": True,
                                 "source_both_markers_preserved": True}
        report["validation_effects"] = "sequence-check row rolled back; sequence values consumed by validation are not transactional"
        report["status"] = "PASS_LOCAL_TOOLING_DRILL"
    except Exception as error:
        report["error"] = str(error)
    finally:
        for cid in owned:
            try:
                info = json.loads(run(["inspect", cid]))[0]
                assert info["Config"]["Labels"].get("mc021.drill") == token
                run(["logs", cid])
                run(["stop", "--time", "10", cid])
                assert json.loads(run(["inspect", cid]))[0]["State"]["Running"] is False
            except Exception as error:
                report["status"] = "FAILED"
                report.setdefault("cleanup_errors", []).append(str(error))
        report["elapsed_seconds"] = time.monotonic()-started
        report["finished_utc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        report["cleanup"] = "only owned containers stopped; no volume deletion or pruning; tmpfs discarded"
        (out / "manifest.json").write_text(json.dumps(report, indent=2)+"\n")
        print(json.dumps({k:v for k,v in report.items() if k not in ("commands",)}, indent=2))
    assert report["status"] == "PASS_LOCAL_TOOLING_DRILL", report.get("error", report.get("cleanup_errors"))


if __name__ == "__main__":
    main()
