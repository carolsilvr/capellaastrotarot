import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  reading_minutes: number;
  published_at: string | null;
  cover_image_url: string | null;
};

const postsQuery = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: async (): Promise<PostSummary[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, reading_minutes, published_at, cover_image_url")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PostSummary[];
  },
  staleTime: 60_000,
});

export const Route = createFileRoute("/blog")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => ({
    meta: [
      { title: "blog — capella" },
      {
        name: "description",
        content:
          "reflexões sobre tarot, astrologia e o uso das linguagens simbólicas como ferramenta de autoconhecimento.",
      },
      { property: "og:title", content: "blog — capella" },
      {
        property: "og:description",
        content: "leituras curtas sobre símbolos, ciclos e vida cotidiana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
  errorComponent: ({ reset }) => (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <div>
        <p className="text-muted-foreground mb-4">não foi possível carregar o blog.</p>
        <button onClick={() => reset()} className="text-accent underline">tentar novamente</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center px-6 text-center">
      <Link to="/" className="text-accent underline">voltar ao início</Link>
    </div>
  ),
});

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-serif text-xl tracking-wide">
            capella<span className="text-accent">.</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            <ArrowLeft className="size-4" /> voltar
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">blog</p>
          <h1 className="text-serif text-5xl sm:text-6xl leading-[1.05]">reflexões.</h1>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            escritos curtos sobre tarot, astrologia e o uso do simbólico no cotidiano. leia sem pressa.
          </p>
        </div>

        {posts.length === 0 && (
          <p className="text-muted-foreground">em breve, os primeiros escritos por aqui.</p>
        )}

        {featured && (
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group block border-y border-border py-10 mb-16 hover:border-accent transition-colors"
          >
            <div className="grid gap-8 lg:grid-cols-5 items-center">
              <div className="lg:col-span-3">
                <p className="text-xs uppercase tracking-wider text-accent mb-3">{featured.category}</p>
                <h2 className="text-serif text-3xl sm:text-4xl leading-tight group-hover:text-accent transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(featured.published_at)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {featured.reading_minutes} min
                  </span>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="aspect-[4/3] rounded-sm bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center border border-border overflow-hidden">
                  {featured.cover_image_url ? (
                    <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-serif text-6xl text-accent/40">✦</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid gap-10 sm:grid-cols-2">
          {rest.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col gap-4"
            >
              <div className="aspect-[16/10] rounded-sm bg-gradient-to-br from-secondary via-accent/5 to-primary/10 border border-border flex items-center justify-center overflow-hidden group-hover:border-accent transition-colors">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-serif text-5xl text-accent/40">✦</span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-accent mb-2">{p.category}</p>
                <h3 className="text-serif text-2xl leading-snug group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(p.published_at)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" /> {p.reading_minutes} min
                  </span>
                  <ArrowRight className="size-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
