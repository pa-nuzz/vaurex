import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    supabase: Client = create_client(url, key)
    
    # Check if bucket exists
    try:
        buckets = supabase.storage.list_buckets()
        avatar_exists = any(b.name == 'avatars' for b in buckets)
    except Exception as e:
        print(f"Error checking buckets: {e}")
        # Sometimes list_buckets fails on older supabse client, try catching
        avatar_exists = False

    if not avatar_exists:
        try:
            print("Creating 'avatars' bucket...")
            supabase.storage.create_bucket(
                "avatars",
                options={"public": True, "file_size_limit": 2097152, "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]}
            )
            print("Bucket 'avatars' created successfully.")
        except Exception as e:
            print(f"Failed to create bucket: {e}")
            if "already exists" not in str(e).lower():
                sys.exit(1)
    else:
        print("Bucket 'avatars' already exists.")
        
    print("Done")

if __name__ == "__main__":
    main()
