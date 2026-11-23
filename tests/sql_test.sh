#!/usr/bin/env bash
# Uji skema + RLS di Postgres lokal.  Pemakaian: PGHOST=/tmp/pgd PGPORT=5544 PGUSER=postgres bash tests/sql_test.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=gonest_test
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
P="psql -q -v ON_ERROR_STOP=1 -d $DB"
$P -f tests/supabase_stub.sql
$P -f supabase/migrations/001_schema.sql
$P -f supabase/migrations/002_seed.sql
$P -f supabase/migrations/001_schema.sql   # jalan ulang harus aman
$P -f supabase/migrations/002_seed.sql
$P -f supabase/migrations/003_grants.sql
$P -f supabase/migrations/003_grants.sql
$P -f tests/rls_test.sql
echo "SEMUA TES SQL LULUS"
