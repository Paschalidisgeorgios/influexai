"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TurndownService from "turndown";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminBlogPost,
  listAdminBlogPosts,
  unpublishBlogPost,
  upsertBlogPost,
} from "@/app/actions/blog-admin";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { slugifyTitle } from "@/lib/blog/slug";
import type { BlogPost } from "@/lib/blog/types";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#B4FF00]/50 focus:outline-none";

const EDIT_CATEGORIES = BLOG_CATEGORIES.filter((c) => c !== "Alle");

function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  return turndown.turndown(html);
}

function TipTapField({
  content,
  onChange,
}: {
  content: string;
  onChange: (md: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Artikel-Inhalt schreiben…" }),
    ],
    content: `<p>${content.replace(/\n/g, "</p><p>")}</p>`,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-xl border border-white/10 bg-[#060608] px-4 py-3 text-sm text-white focus:outline-none prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(htmlToMarkdown(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = htmlToMarkdown(editor.getHTML());
    if (content !== current && content.length > 0) {
      editor.commands.setContent(
        content.startsWith("<") ? content : `<p>${content.replace(/\n/g, "</p><p>")}</p>`
      );
    }
  }, [content, editor]);

  if (!editor) return <div className="h-80 animate-pulse rounded-xl bg-white/5" />;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {(
          [
            ["bold", () => editor.chain().focus().toggleBold().run(), "B"],
            ["italic", () => editor.chain().focus().toggleItalic().run(), "I"],
            ["h2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2"],
            ["h3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3"],
            ["bullet", () => editor.chain().focus().toggleBulletList().run(), "• List"],
          ] as const
        ).map(([key, fn, label]) => (
          <button
            key={key}
            type="button"
            onClick={fn}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-[#B4FF00]/40"
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function BlogPostEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [meta, setMeta] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Tutorial");
  const [coverUrl, setCoverUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await listAdminBlogPosts();
    if (res.ok && res.posts) setPosts(res.posts);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const resetNew = () => {
    setSelectedId(null);
    setTitle("");
    setSlug("");
    setMeta("");
    setExcerpt("");
    setContent("");
    setCategory("Tutorial");
    setCoverUrl("");
    setPublished(false);
  };

  const loadPost = async (id: string) => {
    const res = await getAdminBlogPost(id);
    if (!res.ok || !res.post) return;
    const p = res.post;
    setSelectedId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setMeta(p.meta_description);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setCategory(p.category);
    setCoverUrl(p.og_image_url ?? "");
    setPublished(p.published);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await upsertBlogPost({
      id: selectedId ?? undefined,
      title,
      slug: slug || slugifyTitle(title),
      meta_description: meta,
      content,
      excerpt,
      category,
      og_image_url: coverUrl || null,
      published,
    });
    setSaving(false);
    if (!res.ok) {
      setMessage(res.error ?? "Fehler");
      return;
    }
    setMessage(published ? "Veröffentlicht." : "Entwurf gespeichert.");
    if (res.postId) setSelectedId(res.postId);
    await loadList();
  };

  const draft = async () => {
    setPublished(false);
    await save();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/80">Artikel</h2>
          <button
            type="button"
            onClick={resetNew}
            className="text-xs text-[#B4FF00] hover:underline"
          >
            + Neu
          </button>
        </div>
        <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
          {posts.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => void loadPost(p.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === p.id
                    ? "bg-[#B4FF00]/15 text-[#B4FF00]"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="line-clamp-1 font-medium">{p.title}</span>
                <span className="text-xs text-white/65">
                  {p.published ? "Live" : "Draft"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard/admin/content"
          className="mt-6 block text-xs text-white/70 hover:text-[#B4FF00]"
        >
          → SEO Content Engine
        </Link>
      </aside>

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Blog verwalten</h1>
        {message && (
          <p className="text-sm text-[#B4FF00]">{message}</p>
        )}

        <input
          className={inputClass}
          placeholder="Titel"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!selectedId) setSlug(slugifyTitle(e.target.value));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="slug-url"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {EDIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          className={inputClass}
          placeholder="Meta Description (max 160 Zeichen)"
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Excerpt / Teaser"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Cover-Bild URL (OG Image)"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />

        <TipTapField content={content} onChange={setContent} />

        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-[#B4FF00]"
          />
          Veröffentlichen (Publish)
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="btn-acid"
          >
            {saving ? "…" : published ? "Veröffentlichen" : "Speichern"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void draft()}
            className="btn-ghost"
          >
            Als Entwurf speichern
          </button>
          {selectedId && published && (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                await unpublishBlogPost(selectedId);
                setPublished(false);
                setMessage("Zurückgezogen.");
                await loadList();
              }}
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400"
            >
              Unpublish
            </button>
          )}
          {slug && (
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              className="text-sm text-white/80 hover:text-[#B4FF00] self-center"
            >
              Vorschau →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
