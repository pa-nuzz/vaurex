-- Knowledge Base Collections
create table if not exists kb_collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    doc_count int default 0,
    created_at timestamptz default now()
);

-- KB Documents
create table if not exists kb_documents (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid references kb_collections(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    filename text not null,
    raw_text text,
    chunk_count int default 0,
    status text default 'processing',
    created_at timestamptz default now()
);

-- KB Chunks for search
create table if not exists kb_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references kb_documents(id) on delete cascade,
    collection_id uuid references kb_collections(id) on delete cascade,
    content text not null,
    chunk_index int,
    created_at timestamptz default now()
);

-- Full text search index
create index if not exists kb_chunks_fts on kb_chunks
using gin(to_tsvector('english', content));

-- Compliance Reports
create table if not exists compliance_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    scan_id uuid references scans(id) on delete cascade,
    industry text not null,
    overall_score int default 0,
    critical_count int default 0,
    high_count int default 0,
    medium_count int default 0,
    low_count int default 0,
    violations jsonb default '[]',
    recommendations jsonb default '[]',
    created_at timestamptz default now()
);

-- Support Logs
create table if not exists support_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    scan_id uuid,
    subject text,
    message text not null,
    email text,
    status text default 'received',
    created_at timestamptz default now()
);

-- Helper functions for collection doc count management
create or replace function increment_collection_doc_count(p_collection_id uuid)
returns void as $$
begin
    update kb_collections 
    set doc_count = doc_count + 1
    where id = p_collection_id;
end;
$$ language plpgsql;

create or replace function decrement_collection_doc_count(p_collection_id uuid)
returns void as $$
begin
    update kb_collections 
    set doc_count = greatest(doc_count - 1, 0)
    where id = p_collection_id;
end;
$$ language plpgsql;

-- RLS Policies
alter table kb_collections enable row level security;
alter table kb_documents enable row level security;
alter table kb_chunks enable row level security;
alter table compliance_reports enable row level security;
alter table support_logs enable row level security;

-- Users can only access their own collections
create policy "users own kb_collections" on kb_collections
for all using (auth.uid() = user_id);

-- Users can only access their own documents
create policy "users own kb_documents" on kb_documents
for all using (auth.uid() = user_id);

-- Users can only access chunks from their own collections
create policy "users own kb_chunks" on kb_chunks
for all using (
    collection_id in (select id from kb_collections where user_id = auth.uid())
);

-- Users can only access their own compliance reports
create policy "users own compliance_reports" on compliance_reports
for all using (auth.uid() = user_id);

-- Users can only access their own support logs, but support staff can access all
create policy "users own support_logs" on support_logs
for select using (auth.uid() = user_id);

create policy "users can insert support_logs" on support_logs
for insert with check (auth.uid() = user_id);

-- Support staff role (if you have one) can view all support logs
-- create policy "support staff can view all support_logs" on support_logs
-- for select using (auth.jwt() ->> 'role' = 'support_staff');

-- Indexes for better performance
create index if not exists kb_collections_user_id_idx on kb_collections(user_id);
create index if not exists kb_documents_collection_id_idx on kb_documents(collection_id);
create index if not exists kb_documents_user_id_idx on kb_documents(user_id);
create index if not exists kb_chunks_document_id_idx on kb_chunks(document_id);
create index if not exists kb_chunks_collection_id_idx on kb_chunks(collection_id);
create index if not exists compliance_reports_user_id_idx on compliance_reports(user_id);
create index if not exists compliance_reports_scan_id_idx on compliance_reports(scan_id);
create index if not exists support_logs_user_id_idx on support_logs(user_id);
create index if not exists support_logs_scan_id_idx on support_logs(scan_id);
create index if not exists support_logs_status_idx on support_logs(status);

-- Triggers to automatically update collection doc counts
create or replace function update_collection_doc_count_on_insert()
returns trigger as $$
begin
    update kb_collections 
    set doc_count = doc_count + 1
    where id = new.collection_id;
    return new;
end;
$$ language plpgsql;

create or replace function update_collection_doc_count_on_delete()
returns trigger as $$
begin
    update kb_collections 
    set doc_count = greatest(doc_count - 1, 0)
    where id = old.collection_id;
    return old;
end;
$$ language plpgsql;

-- Create triggers
drop trigger if exists kb_doc_insert_trigger on kb_documents;
create trigger kb_doc_insert_trigger
after insert on kb_documents
for each row
execute function update_collection_doc_count_on_insert();

drop trigger if exists kb_doc_delete_trigger on kb_documents;
create trigger kb_doc_delete_trigger
after delete on kb_documents
for each row
execute function update_collection_doc_count_on_delete();

-- Comments for documentation
comment on table kb_collections is 'Knowledge base collections for organizing documents';
comment on table kb_documents is 'Individual documents uploaded to knowledge base';
comment on table kb_chunks is 'Text chunks from documents for search functionality';
comment on table compliance_reports is 'Industry compliance analysis reports';
comment on table support_logs is 'Support requests and feedback from users';

comment on column kb_collections.doc_count is 'Number of documents in this collection (maintained by trigger)';
comment on column kb_documents.status is 'processing, completed, or failed';
comment on column kb_documents.chunk_count is 'Number of text chunks this document was split into';
comment on column compliance_reports.overall_score is 'Compliance score from 0-100';
comment on column compliance_reports.violations is 'JSON array of compliance violations found';
comment on column compliance_reports.recommendations is 'JSON array of recommendations for compliance';
comment on column support_logs.status is 'received, processing, resolved, etc.';
