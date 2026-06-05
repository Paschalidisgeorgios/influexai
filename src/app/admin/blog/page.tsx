import { BlogPostEditor } from "@/components/admin/blog-post-editor";

export const metadata = {
  title: "Blog Admin — InfluexAI",
  description: "Blog-Posts erstellen und veröffentlichen",
};

export default function AdminBlogPage() {
  return <BlogPostEditor />;
}
