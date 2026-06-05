"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createDraftFromKeywordIdea,
  generateKeywordIdeas,
  getAdminBlogPost,
  listAdminBlogPosts,
  publishBlogPost,
  runBlogSeoCheckAction,
  saveBlogDraft,
  scheduleBlogPost,
} from "@/app/actions/blog-admin";
import { generateBlogPost } from "@/app/actions/generate-blog-post";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { markdownToHtml } from "@/lib/blog/markdown";
import type { BlogPost, KeywordIdea, SeoCheckItem } from "@/lib/blog/types";

const LANGUAGES = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "el", label: "EL" },
  { code: "tr", label: "TR" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
] as const;

const WORD_COUNTS = [800, 1200, 1800, 2500];

const GEN_STEPS = [
  "Analysiere Keyword-Intent...",
  "Erstelle Artikel-Outline...",
  "Schreibe Artikel...",
  "Optimiere für SEO...",
  "Generiere Meta-Daten...",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#B4FF00]/50 focus:outline-none";

function postStatus(post: BlogPost): "draft" | "scheduled" | "published" {
  if (post.published) return "published";
  if (post.scheduled_at) return "scheduled";
  return "draft";
}

function statusColor(status: ReturnType<typeof postStatus>): string {
  if (status === "published") return "#B4FF00";
  if (status === "scheduled") return "#3b82f6";
  return "#6b7280";
}

export function ContentEngine() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [secondary, setSecondary] = useState("");
  const [category, setCategory] = useState("Tutorial");
  const [language, setLanguage] = useState("de");
  const [wordCount, setWordCount] = useState(1200);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editContent, setEditContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [seoChecks, setSeoChecks] = useState<SeoCheckItem[] | null>(null);

  const [nicheInput, setNicheInput] = useState("");
  const [keywordIdeas, setKeywordIdeas] = useState<KeywordIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    const res = await listAdminBlogPosts();
    if (res.ok && res.posts) setPosts(res.posts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  const loadEditor = useCallback(async (id: string) => {
    const res = await getAdminBlogPost(id);
    if (!res.ok || !res.post) return;
    setSelectedId(id);
    setEditTitle(res.post.title);
    setEditMeta(res.post.meta_description);
    setEditContent(res.post.content);
    setSeoChecks(null);
    const html = await markdownToHtml(res.post.content);
    setPreviewHtml(html);
  }, []);

  useEffect(() => {
    if (selectedId && !selected) loadEditor(selectedId);
  }, [selectedId, selected, loadEditor]);

  const runGeneration = async () => {
    setGenerating(true);
    setGenError(null);
    setGenStep(0);

    const interval = setInterval(() => {
      setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1));
    }, 3500);

    const res = await generateBlogPost({
      targetKeyword: keyword,
      secondaryKeywords: secondary,
      category,
      language,
      wordCount,
    });

    clearInterval(interval);
    setGenerating(false);
    setGenStep(GEN_STEPS.length);

    if (!res.success) {
      setGenError(res.error);
      return;
    }

    await loadPosts();
    await loadEditor(res.postId);
  };

  const handleSaveDraft = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await saveBlogDraft({
      id: selectedId,
      title: editTitle,
      meta_description: editMeta,
      content: editContent,
    });
    setSaving(false);
    if (res.ok) {
      await loadPosts();
      setPreviewHtml(await markdownToHtml(editContent));
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setSaving(true);
    await saveBlogDraft({
      id: selectedId,
      title: editTitle,
      meta_description: editMeta,
      content: editContent,
    });
    setSaving(false);
    await publishBlogPost(selectedId);
    await loadPosts();
    const res = await getAdminBlogPost(selectedId);
    if (res.ok && res.post) {
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedId ? res.post! : p))
      );
    }
  };

  const handleSeoCheck = async () => {
    if (!selectedId) return;
    const res = await runBlogSeoCheckAction(selectedId);
    if (res.ok && res.checks) setSeoChecks(res.checks);
  };

  const handlePreviewRefresh = async () => {
    setPreviewHtml(await markdownToHtml(editContent));
  };

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const postsByDay = useMemo(() => {
    const map = new Map<string, BlogPost[]>();
    for (const p of posts) {
      const key = p.scheduled_at
        ? p.scheduled_at.slice(0, 10)
        : p.published_at
          ? p.published_at.slice(0, 10)
          : null;
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  const handleIdeas = async () => {
    setIdeasLoading(true);
    const res = await generateKeywordIdeas(nicheInput);
    setIdeasLoading(false);
    if (res.ok && res.ideas) setKeywordIdeas(res.ideas);
  };

  const seoIcon = (status: SeoCheckItem["status"]) => {
    if (status === "pass") return "✅";
    if (status === "warn") return "⚠️";
    return "❌";
  };

  if (loading) {
    return (
      <p className="text-white/70 py-20 text-center">Lade Content Engine…</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          SEO Content Engine
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Blog-Artikel mit KI generieren, prüfen und veröffentlichen.
        </p>
        <Link
          href="/blog"
          target="_blank"
          className="mt-2 inline-block text-sm text-[#B4FF00] hover:underline"
        >
          Öffentlichen Blog öffnen →
        </Link>
      </div>

      {/* Generator */}
      <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-medium text-white">
          Artikel generieren
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/80">
              Target Keyword
            </label>
            <input
              className={inputClass}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="youtube shorts script schreiben"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/80">
              Secondary Keywords (kommagetrennt)
            </label>
            <input
              className={inputClass}
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="hook, cta, viral"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/80">
              Kategorie
            </label>
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {BLOG_CATEGORIES.filter((c) => c !== "Alle").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/80">Sprache</label>
            <select
              className={inputClass}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/80">
              Ziel-Wortanzahl
            </label>
            <select
              className={inputClass}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
            >
              {WORD_COUNTS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {generating && (
          <ul className="mt-6 space-y-2">
            {GEN_STEPS.map((label, i) => (
              <li
                key={label}
                className={`text-sm ${
                  i <= genStep ? "text-[#B4FF00]" : "text-white/65"
                }`}
              >
                {i < genStep ? "✓" : i === genStep ? "…" : "○"} {label}
              </li>
            ))}
          </ul>
        )}

        {genError && <p className="mt-4 text-sm text-red-400">{genError}</p>}

        <button
          type="button"
          disabled={generating || !keyword.trim()}
          onClick={runGeneration}
          className="mt-6 rounded-xl bg-[#B4FF00] px-6 py-3 text-sm font-semibold text-black disabled:opacity-40 hover:bg-[#c8ff33]"
        >
          {generating ? "Generiere…" : "Artikel generieren"}
        </button>
      </section>

      {/* Keyword ideas */}
      <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-medium text-white">Keyword-Ideen</h2>
        <div className="flex flex-wrap gap-3">
          <input
            className={`${inputClass} max-w-md flex-1`}
            value={nicheInput}
            onChange={(e) => setNicheInput(e.target.value)}
            placeholder="YouTube Shorts Creator Tools"
          />
          <button
            type="button"
            disabled={ideasLoading || !nicheInput.trim()}
            onClick={handleIdeas}
            className="rounded-xl border border-[#B4FF00]/40 px-5 py-2.5 text-sm font-medium text-[#B4FF00] hover:bg-[#B4FF00]/10 disabled:opacity-40"
          >
            {ideasLoading ? "Generiere…" : "Keyword-Ideen generieren"}
          </button>
        </div>
        {keywordIdeas.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-white/70 border-b border-white/10">
                  <th className="py-2 pr-4">Keyword</th>
                  <th className="py-2 pr-4">Intent</th>
                  <th className="py-2 pr-4">Difficulty</th>
                  <th className="py-2 pr-4">Titel</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {keywordIdeas.map((idea) => (
                  <tr
                    key={idea.keyword}
                    className="border-b border-white/5 text-white/70"
                  >
                    <td className="py-3 pr-4 font-medium text-white">
                      {idea.keyword}
                    </td>
                    <td className="py-3 pr-4 max-w-[140px] truncate">
                      {idea.searchIntent}
                    </td>
                    <td className="py-3 pr-4">{idea.difficulty}</td>
                    <td className="py-3 pr-4 max-w-[200px] truncate">
                      {idea.suggestedTitle}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="text-[#B4FF00] hover:underline"
                        onClick={async () => {
                          const res = await createDraftFromKeywordIdea({
                            keyword: idea.keyword,
                            suggestedTitle: idea.suggestedTitle,
                            category,
                            language,
                            estimatedWordCount: idea.estimatedWordCount,
                          });
                          if (res.ok && res.postId) {
                            setKeyword(idea.keyword);
                            await loadPosts();
                            await loadEditor(res.postId);
                          }
                        }}
                      >
                        Artikel erstellen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Calendar */}
      <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="mb-4 text-lg font-medium text-white">
          Content Kalender
        </h2>
        <div className="mb-4 flex gap-4 text-xs text-white/80">
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-gray-500 mr-1" />
            Entwurf
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1" />
            Geplant
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-[#B4FF00] mr-1" />
            Veröffentlicht
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {calendarDays.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayPosts = postsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="min-h-[88px] rounded-lg border border-white/10 bg-white/[0.02] p-2"
              >
                <p className="text-[10px] text-white/70">
                  {day.toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadEditor(p.id)}
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white/80 hover:bg-white/10"
                      style={{
                        borderLeft: `2px solid ${statusColor(postStatus(p))}`,
                      }}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Draft list + editor */}
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4">
          <h3 className="mb-3 text-sm font-medium text-white/80">Artikel</h3>
          <ul className="max-h-[480px] space-y-1 overflow-y-auto">
            {posts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => loadEditor(p.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                    selectedId === p.id
                      ? "bg-[#B4FF00]/15 text-[#B4FF00]"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: statusColor(postStatus(p)) }}
                  />
                  {p.title || p.slug}
                  {!p.published && (
                    <span className="ml-1 text-white/65">(Entwurf)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selectedId && selected ? (
          <section className="space-y-6 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-white">
                Vorschau & Bearbeitung
              </h2>
              <div className="flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                  value={
                    selected.scheduled_at
                      ? selected.scheduled_at.slice(0, 16)
                      : ""
                  }
                  onChange={async (e) => {
                    const v = e.target.value;
                    await scheduleBlogPost(
                      selectedId,
                      v ? new Date(v).toISOString() : null
                    );
                    await loadPosts();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSeoCheck}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-[#B4FF00]/40"
                >
                  SEO Check
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDraft}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-white/30"
                >
                  Als Entwurf speichern
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="rounded-lg bg-[#B4FF00] px-3 py-1.5 text-xs font-semibold text-black"
                >
                  Veröffentlichen
                </button>
              </div>
            </div>

            {seoChecks && (
              <ul className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm space-y-1">
                {seoChecks.map((c) => (
                  <li key={c.id} className="text-white/70">
                    {seoIcon(c.status)} {c.label}
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs text-white/80">
                  Titel
                </label>
                <input
                  className={inputClass}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/80">
                  Meta Description ({editMeta.length}/160)
                </label>
                <input
                  className={inputClass}
                  value={editMeta}
                  onChange={(e) => setEditMeta(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/80">
                  Inhalt (Markdown)
                </label>
                <textarea
                  className={`${inputClass} min-h-[200px] font-mono`}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handlePreviewRefresh}
                  className="mt-2 text-xs text-[#B4FF00] hover:underline"
                >
                  Vorschau aktualisieren
                </button>
              </div>
            </div>

            <div className="blog-prose rounded-xl border border-white/10 bg-[#060608] p-6">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            {selected.published && (
              <p className="text-sm text-[#B4FF00]">
                Live:{" "}
                <Link href={`/blog/${selected.slug}`} className="underline">
                  /blog/{selected.slug}
                </Link>
              </p>
            )}
          </section>
        ) : (
          <p className="text-white/70 py-12 text-center rounded-2xl border border-dashed border-white/10">
            Wähle einen Artikel oder generiere einen neuen.
          </p>
        )}
      </div>
    </div>
  );
}
