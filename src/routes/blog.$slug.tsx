import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  reading_minutes: number;
  author_name: string;
  published_at: string | null;
  cover_image_url: string | null;
};

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog-post", slug],
    queryFn: async (): Promise<Post> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, content, category, reading_minutes, author_name, published_at, cover_image_url")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as Post;
    },
    staleTime: 60_000,
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(postQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "post não encontrado — capella" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} — capella`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PostPage,
  errorComponent: ({ reset }) => (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <div>
        <p className="text-muted-foreground mb-4">não foi possível carregar este post.</p>
        <button onClick={() => reset()} className="text-accent underline">tentar novamente</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-serif text-4xl mb-3">post não encontrado</h1>
        <Link to="/blog" className="text-accent underline">ver todos os posts</Link>
      </div>
    </div>
  ),
});

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Minimal markdown-ish renderer for h2, paragraphs, and **bold**. */
function renderContent(md: string) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-serif text-3xl mt-14 mb-4">
          {block.slice(3)}
        </h2>
      );
    }
    // inline bold
    const parts = block.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      seg.startsWith("**") && seg.endsWith("**") ? (
        <strong key={j} className="text-foreground">{seg.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{seg}</span>
      ),
    );
    return (
      <p key={i} className="text-base sm:text-lg leading-[1.8] text-foreground/85 mb-5">
        {parts}
      </p>
    );
  });
}

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-serif text-xl tracking-wide">
            capella<span className="text-accent">.</span>
          </Link>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <ArrowLeft className="size-4" /> todos os posts
          </Link>
        </nav>
      </header>

      <article className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">{post.category}</p>
        <h1 className="text-serif text-4xl sm:text-5xl leading-[1.1]">{post.title}</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-b border-border pb-8">
          <span>por {post.author_name}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {formatDate(post.published_at)}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {post.reading_minutes} min
          </span>
        </div>

        <div className="mt-10">{renderContent(post.content)}</div>

        <div className="mt-20 rounded-sm border border-border bg-card p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">quando fizer sentido</p>
          <h3 className="text-serif text-2xl sm:text-3xl mb-4">agende uma leitura.</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            se algo por aqui te tocou, uma sessão é o próximo passo para trazer isso ao seu momento presente.
          </p>
          <a
            href="/agendar"
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm hover:opacity-90 transition-opacity"
          >
            agendar <ArrowRight className="size-4" />
          </a>
        </div>
      </article>
    </div>
  );
}
