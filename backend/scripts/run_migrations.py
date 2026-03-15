import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing Supabase credentials in environment variables.")
    sys.exit(1)

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def run_sql_file(filepath: str):
    logger.info(f"Applying migration: {os.path.basename(filepath)}")
    with open(filepath, "r") as f:
        sql = f.read()

    # Split the SQL file into statements (very basic split by semicolon, ignoring those inside strings/dollar quotes if possible,
    # but since Supabase doesn't easily expose a generic "run this whole huge sql string" via the REST client RPC easily,
    # often the easiest way from python is either a generic RPC or just telling the user to run it in the SQL Editor.
    # Actually, we can just execute it if we have an `exec_sql` RPC or similar. Let's try inserting it as a direct query if possible,
    # or using postgres driver directly if we want to be safe. But wait, `supabase.rpc` might be needed if they exposed a way.)

    # A better, more reliable way to run raw SQL migrations via python is usually using a direct postgresql connection.
    import psycopg2
    from urllib.parse import urlparse
    
    # We need the direct database connection string. Since it's not strictly defined, we can construct it if SUPABASE_DB_URL is available
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        logger.error("SUPABASE_DB_URL is required to run migrations via psycopg2.")
        sys.exit(1)
        
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
        logger.info(f"Successfully applied {os.path.basename(filepath)}")
    except Exception as e:
        logger.error(f"Failed to apply {os.path.basename(filepath)}: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrations_dir = os.path.join(backend_dir, "migrations")
    files_to_run = [
        "20260313_new_features.sql",
        "20260314_security_hardening.sql"
    ]
    
    for filename in files_to_run:
        filepath = os.path.join(migrations_dir, filename)
        if os.path.exists(filepath):
            run_sql_file(filepath)
        else:
            logger.error(f"Migration file not found: {filepath}")
            sys.exit(1)
    
    logger.info("All migrations completed successfully.")
