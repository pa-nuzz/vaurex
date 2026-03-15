"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useToast } from "@/components/ui/Toast";
import { apiJson, safeUiError } from "@/lib/api";

type Collection = {
  collection_id: string;
  name: string;
  description?: string | null;
  doc_count: number;
  created_at: string;
};

export default function KnowledgeBasePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { toast } = useToast();
  const hasShownError = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ success: boolean; data: Collection[] }>(
          "/api/v1/kb/collections",
          {},
          {
            auth: true,
            timeoutMs: 30000,
            fallbackMessage: "Unable to load knowledge base collections.",
          },
        );
        if (data.success) {
          setCollections(data.data ?? []);
        }
      } catch (error) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          toast.error(safeUiError(error, "Unable to load knowledge base collections."));
        }
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast]);

  const handleCreate = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    setCreating(true);
    try {
      const body = new FormData();
      body.append("name", trimmedName);
      if (newDescription.trim()) {
        body.append("description", newDescription.trim());
      }

      const data = await apiJson<{ success: boolean; data: Collection }>(
        "/api/v1/kb/collections",
        {
          method: "POST",
          body,
        },
        {
          auth: true,
          fallbackMessage: "Unable to create collection.",
        },
      );

      if (data.success) {
        setCollections((prev) => [data.data, ...prev]);
        setNewName("");
        setNewDescription("");
        toast.success("Collection created.");
      }
    } catch (error) {
      toast.error(safeUiError(error, "Unable to create collection."));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!window.confirm("Delete this collection and all of its documents?")) return;

    try {
      await apiJson<{ success: boolean; data: unknown }>(
        `/api/v1/kb/collections/${collectionId}`,
        { method: "DELETE" },
        { auth: true, fallbackMessage: "Unable to delete collection." },
      );
      setCollections((prev) => prev.filter((c) => c.collection_id !== collectionId));
      toast.success("Collection deleted.");
    } catch (error) {
      toast.error(safeUiError(error, "Unable to delete collection."));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-0)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(255,107,53,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={20} color="#FF6B35" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Knowledge Base</h1>
              <p style={{ fontSize: 15, color: "var(--text-2)" }}>
                Organize documents into collections for AI-powered search and chat.
              </p>
            </div>
          </div>

          <div
            className="bg-[#2C2C2E] border border-white/[0.06] rounded-xl p-4"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <input
              className="bg-[#1C1C1E] border border-white/[0.06] rounded-lg px-4 py-3 text-white flex-2 focus:border-[#FF6B35] focus:outline-none transition-colors"
              placeholder="Collection name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              style={{ flex: 2 }}
            />
            <input
              className="bg-[#1C1C1E] border border-white/[0.06] rounded-lg px-4 py-3 text-white flex-3 focus:border-[#FF6B35] focus:outline-none transition-colors"
              placeholder="Optional description"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              style={{ flex: 3 }}
            />
            <button
              type="button"
              className="bg-[#FF6B35] hover:bg-[#E55A25] text-white rounded-lg px-6 py-3 font-medium transition-colors flex items-center gap-2"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              <Plus size={16} /> {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }}>
            <SkeletonCard variant="collection-card" />
            <SkeletonCard variant="collection-card" />
            <SkeletonCard variant="collection-card" />
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            type="no-results"
            title="No collections yet"
            description="Create a collection to start building your document knowledge base."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {collections.map((collection) => (
              <div
                key={collection.collection_id}
                className="bg-[#2C2C2E] border border-white/[0.06] rounded-xl p-6 cursor-pointer hover:border-[#FF6B35]/40 transition-all duration-200 hover:shadow-lg"
                style={{
                  transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                }}
                onClick={() => {
                  // Detail view wiring handled elsewhere
                }}
                onMouseEnter={(event) => {
                  (event.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(event) => {
                  (event.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                      {collection.name}
                    </h2>
                    {collection.description && (
                      <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.4 }}>
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Delete collection"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(collection.collection_id);
                    }}
                    className="text-zinc-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 150ms",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                    <span style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>
                      {collection.doc_count} document{collection.doc_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {new Date(collection.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

