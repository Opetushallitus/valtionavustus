#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/db-tunnel-functions.sh"

DUMP_FILE=""

function usage {
  echo "Usage: pull-va-data-{qa|prod}.sh --avustushaku <id> [--hakemus <id>]"
  echo ""
  echo "Pull avustushaku (and related hakemus) data from a remote environment into"
  echo "the local dev database."
  echo ""
  echo "Options:"
  echo "  --avustushaku <id>   ID of the avustushaku to pull (required unless --hakemus is given)"
  echo "  --hakemus <id>       ID of a single hakemus to pull (resolves avustushaku automatically)"
  echo ""
  echo "Examples:"
  echo "  ./pull-va-data-qa.sh --avustushaku 123"
  echo "  ./pull-va-data-prod.sh --hakemus 456"
  echo "  ./pull-va-data-qa.sh --avustushaku 123 --hakemus 456"
  exit 1
}

function export_table {
  local table_name="$1"
  local query="$2"
  local optional="${3:-}"

  info "Exporting ${table_name}..."

  # Get column list from information_schema
  local schema_name="${table_name%%.*}"
  local bare_table="${table_name#*.}"

  local columns
  columns=$("${REMOTE_PSQL[@]}" -t -A -c \
    "SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
     FROM information_schema.columns
     WHERE table_schema = '${schema_name}' AND table_name = '${bare_table}'") || {
    if [ "${optional}" = "optional" ]; then
      info "  Skipped ${table_name} (could not get columns)"
      return 0
    else
      fatal "Failed to get columns for ${table_name}"
    fi
  }

  if [ -z "${columns}" ]; then
    if [ "${optional}" = "optional" ]; then
      info "  Skipped ${table_name} (table not found)"
      return 0
    else
      fatal "Table ${table_name} not found in remote database"
    fi
  fi

  # Export data using COPY TO STDOUT
  local csv_data
  csv_data=$("${REMOTE_PSQL[@]}" -c \
    "COPY (${query}) TO STDOUT WITH (FORMAT csv, HEADER)") || {
    if [ "${optional}" = "optional" ]; then
      info "  Skipped ${table_name} (query failed)"
      return 0
    else
      fatal "Failed to export ${table_name}"
    fi
  }

  # Count rows (subtract 1 for header line)
  local row_count
  row_count=$(echo "${csv_data}" | wc -l | tr -d ' ')
  row_count=$((row_count - 1))

  if [ "${row_count}" -le 0 ]; then
    info "  ${table_name}: 0 rows"
    return 0
  fi

  # Append COPY block to dump file
  {
    echo "COPY ${table_name} (${columns}) FROM STDIN WITH (FORMAT csv, HEADER);"
    echo "${csv_data}"
    echo "\\."
    echo ""
  } >> "${DUMP_FILE}"

  info "  ${table_name}: ${row_count} rows"
}

function write_delete_statements {
  cat >> "${DUMP_FILE}" << EOSQL
-- Delete existing data for avustushaku ${AVUSTUSHAKU_ID} in dependency order
DELETE FROM virkailija.email WHERE id IN (SELECT email_id FROM virkailija.email_event WHERE avustushaku_id = ${AVUSTUSHAKU_ID});
DELETE FROM virkailija.email_event WHERE avustushaku_id = ${AVUSTUSHAKU_ID};
DELETE FROM virkailija.tapahtumaloki WHERE avustushaku_id = ${AVUSTUSHAKU_ID};
DELETE FROM virkailija.menoluokka_paatos WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID});
DELETE FROM virkailija.menoluokka_muutoshakemus WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID});
DELETE FROM virkailija.menoluokka_hakemus WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID});
DELETE FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID};
DELETE FROM virkailija.avustushaku_project_code WHERE avustushaku_id = ${AVUSTUSHAKU_ID};
DELETE FROM virkailija.avustushaku_talousarviotilit WHERE avustushaku_id = ${AVUSTUSHAKU_ID};
DELETE FROM hakija.form_submissions WHERE id IN (SELECT form_submission_id FROM hakija.hakemukset WHERE avustushaku = ${AVUSTUSHAKU_ID});
DELETE FROM hakija.hakemukset WHERE avustushaku = ${AVUSTUSHAKU_ID};
DELETE FROM hakija.avustushaku_roles WHERE avustushaku = ${AVUSTUSHAKU_ID};
DELETE FROM hakija.forms WHERE id IN (${FORM_IDS});
DELETE FROM hakija.avustushaut WHERE id = ${AVUSTUSHAKU_ID};
EOSQL

  if [ -n "${HAKEMUS_ID_LIST}" ]; then
    cat >> "${DUMP_FILE}" << EOSQL
DELETE FROM virkailija.payments WHERE application_id IN (${HAKEMUS_ID_LIST});
DELETE FROM virkailija.paatos_jatkoaika WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.paatos_sisaltomuutos WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.paatos_talousarvio WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.paatos WHERE id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST});
DELETE FROM virkailija.normalized_hakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST});
DELETE FROM virkailija.scores WHERE arvio_id IN (SELECT id FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.comments WHERE arvio_id IN (SELECT id FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST}));
DELETE FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST});
DELETE FROM hakija.hakemus_paatokset WHERE hakemus_id IN (${HAKEMUS_ID_LIST});
DELETE FROM hakija.application_tokens WHERE application_id IN (${HAKEMUS_ID_LIST});
DELETE FROM hakija.attachments WHERE hakemus_id IN (${HAKEMUS_ID_LIST});
DELETE FROM virkailija.hakemus WHERE id IN (${HAKEMUS_ID_LIST});
EOSQL
  fi

  echo "" >> "${DUMP_FILE}"
}

function export_data {
  info "Building hakemus ID list..."

  if [ -n "${HAKEMUS_ID:-}" ]; then
    # Single hakemus mode: just use the provided ID
    HAKEMUS_ID_LIST="${HAKEMUS_ID}"
  else
    # All hakemukset for this avustushaku
    HAKEMUS_ID_LIST=$("${REMOTE_PSQL[@]}" -t -A -c \
      "SELECT string_agg(DISTINCT id::text, ', ') FROM hakija.hakemukset WHERE avustushaku = ${AVUSTUSHAKU_ID}")
  fi

  if [ -z "${HAKEMUS_ID_LIST}" ]; then
    info "No hakemukset found for avustushaku ${AVUSTUSHAKU_ID} — pulling avustushaku data only"
  else
    info "Hakemus IDs: ${HAKEMUS_ID_LIST}"
  fi

  # Get form IDs from avustushaut
  FORM_IDS=$("${REMOTE_PSQL[@]}" -t -A -c \
    "SELECT string_agg(form_id::text, ', ')
     FROM (
       SELECT form AS form_id FROM hakija.avustushaut WHERE id = ${AVUSTUSHAKU_ID}
       UNION
       SELECT form_valiselvitys FROM hakija.avustushaut WHERE id = ${AVUSTUSHAKU_ID} AND form_valiselvitys IS NOT NULL
       UNION
       SELECT form_loppuselvitys FROM hakija.avustushaut WHERE id = ${AVUSTUSHAKU_ID} AND form_loppuselvitys IS NOT NULL
     ) forms")

  if [ -z "${FORM_IDS}" ]; then
    fatal "No forms found for avustushaku ${AVUSTUSHAKU_ID}"
  fi

  info "Form IDs: ${FORM_IDS}"

  # Write SQL header
  {
    echo "-- Data export for avustushaku ${AVUSTUSHAKU_ID} from ${ENV}"
    echo "-- Generated at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo ""
    echo "SET session_replication_role = replica;"
    echo "BEGIN;"
    echo ""
    echo "-- Disable check constraints on imported tables (production data may not satisfy newer constraints)"
    echo "DO \$\$ DECLARE r RECORD;"
    echo "BEGIN"
    echo "  FOR r IN SELECT conname, conrelid::regclass AS table_name"
    echo "           FROM pg_constraint"
    echo "           WHERE contype = 'c'"
    echo "             AND conrelid::regclass::text IN ("
    echo "               'hakija.forms', 'hakija.avustushaut', 'hakija.avustushaku_roles',"
    echo "               'hakija.form_submissions', 'hakija.hakemukset', 'hakija.application_tokens',"
    echo "               'hakija.hakemus_paatokset', 'hakija.attachments',"
    echo "               'virkailija.hakemus', 'virkailija.arviot', 'virkailija.comments',"
    echo "               'virkailija.scores', 'virkailija.paatos', 'virkailija.muutoshakemus',"
    echo "               'virkailija.paatos_jatkoaika', 'virkailija.paatos_sisaltomuutos',"
    echo "               'virkailija.paatos_talousarvio', 'virkailija.normalized_hakemus',"
    echo "               'virkailija.menoluokka', 'virkailija.menoluokka_hakemus',"
    echo "               'virkailija.menoluokka_muutoshakemus', 'virkailija.menoluokka_paatos',"
    echo "               'virkailija.avustushaku_project_code', 'virkailija.avustushaku_talousarviotilit',"
    echo "               'virkailija.tapahtumaloki', 'virkailija.payments',"
    echo "               'virkailija.email', 'virkailija.email_event'"
    echo "             )"
    echo "  LOOP"
    echo "    BEGIN"
    echo "      EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I NOT ENFORCED', r.table_name, r.conname);"
    echo "    EXCEPTION WHEN OTHERS THEN NULL;"
    echo "    END;"
    echo "  END LOOP;"
    echo "END \$\$;"
    echo ""
  } > "${DUMP_FILE}"

  # Write delete statements
  write_delete_statements

  # Export tables in dependency order (parents first)
  export_table "hakija.forms" \
    "SELECT * FROM hakija.forms WHERE id IN (${FORM_IDS})"

  export_table "hakija.avustushaut" \
    "SELECT * FROM hakija.avustushaut WHERE id = ${AVUSTUSHAKU_ID}"

  export_table "hakija.avustushaku_roles" \
    "SELECT * FROM hakija.avustushaku_roles WHERE avustushaku = ${AVUSTUSHAKU_ID}"

  if [ -n "${HAKEMUS_ID_LIST}" ]; then
    export_table "hakija.form_submissions" \
      "SELECT fs.* FROM hakija.form_submissions fs
       WHERE fs.id IN (SELECT form_submission_id FROM hakija.hakemukset WHERE id IN (${HAKEMUS_ID_LIST}) AND avustushaku = ${AVUSTUSHAKU_ID})"

    export_table "virkailija.hakemus" \
      "SELECT * FROM virkailija.hakemus WHERE id IN (${HAKEMUS_ID_LIST})"

    export_table "hakija.hakemukset" \
      "SELECT * FROM hakija.hakemukset WHERE id IN (${HAKEMUS_ID_LIST}) AND avustushaku = ${AVUSTUSHAKU_ID}"

    export_table "hakija.application_tokens" \
      "SELECT * FROM hakija.application_tokens WHERE application_id IN (${HAKEMUS_ID_LIST})" \
      "optional"

    export_table "hakija.hakemus_paatokset" \
      "SELECT * FROM hakija.hakemus_paatokset WHERE hakemus_id IN (${HAKEMUS_ID_LIST})" \
      "optional"

    export_table "virkailija.arviot" \
      "SELECT * FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST})"

    export_table "virkailija.comments" \
      "SELECT * FROM virkailija.comments WHERE arvio_id IN (SELECT id FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))"

    export_table "virkailija.scores" \
      "SELECT * FROM virkailija.scores WHERE arvio_id IN (SELECT id FROM virkailija.arviot WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))"

    export_table "virkailija.paatos" \
      "SELECT * FROM virkailija.paatos WHERE id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))"

    export_table "virkailija.muutoshakemus" \
      "SELECT * FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST})"

    export_table "virkailija.paatos_jatkoaika" \
      "SELECT * FROM virkailija.paatos_jatkoaika WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))" \
      "optional"

    export_table "virkailija.paatos_sisaltomuutos" \
      "SELECT * FROM virkailija.paatos_sisaltomuutos WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))" \
      "optional"

    export_table "virkailija.paatos_talousarvio" \
      "SELECT * FROM virkailija.paatos_talousarvio WHERE paatos_id IN (SELECT paatos_id FROM virkailija.muutoshakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST}))" \
      "optional"

    export_table "virkailija.normalized_hakemus" \
      "SELECT * FROM virkailija.normalized_hakemus WHERE hakemus_id IN (${HAKEMUS_ID_LIST})"
  fi

  export_table "virkailija.menoluokka" \
    "SELECT * FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID}"

  export_table "virkailija.menoluokka_hakemus" \
    "SELECT * FROM virkailija.menoluokka_hakemus WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID})"

  export_table "virkailija.menoluokka_muutoshakemus" \
    "SELECT * FROM virkailija.menoluokka_muutoshakemus WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID})"

  export_table "virkailija.menoluokka_paatos" \
    "SELECT * FROM virkailija.menoluokka_paatos WHERE menoluokka_id IN (SELECT id FROM virkailija.menoluokka WHERE avustushaku_id = ${AVUSTUSHAKU_ID})"

  export_table "virkailija.avustushaku_project_code" \
    "SELECT * FROM virkailija.avustushaku_project_code WHERE avustushaku_id = ${AVUSTUSHAKU_ID}" \
    "optional"

  export_table "virkailija.avustushaku_talousarviotilit" \
    "SELECT * FROM virkailija.avustushaku_talousarviotilit WHERE avustushaku_id = ${AVUSTUSHAKU_ID}" \
    "optional"

  export_table "virkailija.tapahtumaloki" \
    "SELECT * FROM virkailija.tapahtumaloki WHERE avustushaku_id = ${AVUSTUSHAKU_ID}"

  if [ -n "${HAKEMUS_ID_LIST}" ]; then
    export_table "virkailija.payments" \
      "SELECT * FROM virkailija.payments WHERE application_id IN (${HAKEMUS_ID_LIST})" \
      "optional"
  fi

  export_table "virkailija.email" \
    "SELECT * FROM virkailija.email WHERE id IN (SELECT email_id FROM virkailija.email_event WHERE avustushaku_id = ${AVUSTUSHAKU_ID})" \
    "optional"

  export_table "virkailija.email_event" \
    "SELECT * FROM virkailija.email_event WHERE avustushaku_id = ${AVUSTUSHAKU_ID}" \
    "optional"

  # Write SQL footer
  {
    echo ""
    echo "-- Re-enable check constraints"
    echo "DO \$\$ DECLARE r RECORD;"
    echo "BEGIN"
    echo "  FOR r IN SELECT conname, conrelid::regclass AS table_name"
    echo "           FROM pg_constraint"
    echo "           WHERE contype = 'c' AND NOT conenforced"
    echo "             AND connamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('hakija', 'virkailija'))"
    echo "  LOOP"
    echo "    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I ENFORCED NOT VALID', r.table_name, r.conname);"
    echo "  END LOOP;"
    echo "END \$\$;"
    echo ""
    echo "COMMIT;"
    echo "SET session_replication_role = DEFAULT;"
  } >> "${DUMP_FILE}"

  info "Export complete: ${DUMP_FILE}"
}

function import_data {
  info "Importing data into local dev database..."

  local db_container
  db_container=$(docker compose -f "${repo}/docker-compose.yml" -f "${repo}/docker-compose.local-dev.yml" ps --quiet db 2>/dev/null || true)

  if [ -z "${db_container}" ]; then
    # Try without the local-dev override
    db_container=$(docker compose -f "${repo}/docker-compose.yml" ps --quiet db 2>/dev/null || true)
  fi

  if [ -z "${db_container}" ]; then
    fatal "Local database container not found. Is it running? Start with: docker compose up db"
  fi

  info "Using local DB container: ${db_container}"

  # Copy dump file into container
  docker cp "${DUMP_FILE}" "${db_container}:/tmp/va-import.sql"

  # Execute the import
  docker exec "${db_container}" \
    psql -U va -d va-dev -v ON_ERROR_STOP=1 -f /tmp/va-import.sql

  # Clean up the copied file
  docker exec "${db_container}" rm -f /tmp/va-import.sql

  info "Import complete!"
}

function main {
  export AWS_CONFIG_FILE="${VA_SECRETS_REPO}/aws_config"

  AVUSTUSHAKU_ID=""
  HAKEMUS_ID=""

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --avustushaku)
        AVUSTUSHAKU_ID="$2"
        shift 2
        ;;
      --hakemus)
        HAKEMUS_ID="$2"
        shift 2
        ;;
      --help|-h)
        usage
        ;;
      *)
        fatal "Unknown argument: $1"
        ;;
    esac
  done

  if [ -z "${AVUSTUSHAKU_ID}" ] && [ -z "${HAKEMUS_ID}" ]; then
    usage
  fi

  require_command jq
  require_command psql
  require_command docker

  parse_env_from_script_name "pull-va-data"
  configure_aws
  require_aws_session "$ENV"
  start_db_tunnel

  info "Connecting to VA db on [${ENV}]"

  fetch_db_credentials

  # Build REMOTE_PSQL as an array for proper argument handling
  REMOTE_PSQL=(psql --set=sslmode=verify-ca -h 127.0.0.1 -p "${SSH_TUNNEL_PORT}" -U "${USERNAME}" -d "${DBNAME}")

  # Create temp dump file
  DUMP_FILE=$(mktemp /tmp/va-pull-data-XXXXXX.sql)

  # Set up cleanup trap
  trap 'stop_db_tunnel; rm -f "${DUMP_FILE}"' EXIT

  # If only --hakemus given, resolve avustushaku_id from remote DB
  if [ -z "${AVUSTUSHAKU_ID}" ] && [ -n "${HAKEMUS_ID}" ]; then
    info "Resolving avustushaku_id for hakemus ${HAKEMUS_ID}..."
    AVUSTUSHAKU_ID=$("${REMOTE_PSQL[@]}" -t -A -c \
      "SELECT DISTINCT avustushaku FROM hakija.hakemukset WHERE id = ${HAKEMUS_ID}")

    if [ -z "${AVUSTUSHAKU_ID}" ]; then
      fatal "Could not find avustushaku for hakemus ${HAKEMUS_ID}"
    fi

    info "Resolved avustushaku_id: ${AVUSTUSHAKU_ID}"
  fi

  # Export data from remote
  export_data

  # Stop tunnel before importing
  stop_db_tunnel

  # Remove the stop_db_tunnel from trap since we already stopped it
  trap 'rm -f "${DUMP_FILE}"' EXIT

  # Import into local dev DB
  import_data

  info "Successfully pulled avustushaku ${AVUSTUSHAKU_ID} from ${ENV} into local dev database"
}

main "$@"
