# Corrected local restore verification

Owner: actual Local Codex, MC-P0-CODEX-PRIMARY-REMEDIATION-20261028. Synthetic data only. No production/IdP recovery or RPO/RTO commitment.

`baseline-oracle-red.json` reproduces the exact previous comparator accepting a restored set missing an original Matter. `ops/p0-local/restore-rehearsal/verify.py` compares the exact identity/fact set at pre-marker boundary B and makes every mandatory summary check affect exit status. Nine stdlib regressions cover missing/replaced/changed Matters, malformed counters, incomplete summaries, archive refusal and CLI verdicts.

Executed runtime: `runtime-command.json`; stdout/stderr retained alongside it. `runs/20261028T071518Z/summary.json` records the first successful corrected-oracle run (53 Matters). The later DSN-corrected run `runs/20261028T072524Z/summary.json` records 54 Matters and the actual new DB names, boundary, dump hash/times, readback/restart/object equality and negative tests. Dump/restore exit 0. Corrupt/truncated archive restore each exit 1 with zero public tables; altered-object readback exit 1; missing-object readback returned a different object-availability report (exit 0, explicitly recorded, not misrepresented as a refusal).

The newly created source/target DBs and object roots are retained for review; only the exact negative DB created within each negative attempt and its temporary archive paths were removed. Existing DBs/containers/volumes were not removed or reconfigured. Local BFF and IdP were not restarted. Archive and raw test logs remain in the task's `/tmp` work root; public comparison evidence is in this directory. No credentials are exported.

Commands for checker-only verification from project root:

```sh
rtk proxy python3 -m unittest discover -s ops/p0-local/restore-rehearsal -p 'test_*.py' -v
rtk proxy bash -n ops/p0-local/restore-rehearsal/run.sh
```

Runtime requires the already assigned local fixture environment and a fresh run namespace; do not reuse a retained run's output/work/DB names. No resource pruning or existing-target overwrite is part of the script.

Final-source repeat was NOT_EXECUTED: automatic approval review exhausted its usage quota; see `final-source-run-blocked.json`. The last completed restore is tied to the preceding source state, and the final Filing legacy-owner correction has separate current-source backend race evidence. No alternate channel was used to bypass the review failure.
