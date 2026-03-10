import os
from dotenv import load_dotenv
from supabase import create_client, Client

if os.getenv("ENV", "development").lower() != "production":
    load_dotenv()

url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Supabase environment variables are missing")

supabase: Client = create_client(url, key)