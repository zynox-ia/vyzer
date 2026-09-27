# Postgres only on the critical path; Redis unused until measured

Sessions live in Postgres, background jobs run on pg-boss (a Postgres-backed queue, so a job can be enqueued in the same transaction as the change that triggers it), and real-time events travel through Postgres `LISTEN/NOTIFY`. Redis stays in the Docker stack, but no code depends on it until a measurement justifies it. One stateful service is simpler to run, back up and reason about on a single VPS.
