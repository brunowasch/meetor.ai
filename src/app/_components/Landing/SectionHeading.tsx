import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  kicker: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeading({ kicker, title, description, align = "left", tone = "light" }: SectionHeadingProps) {
  const centered = align === "center";
  const dark = tone === "dark";

  return (
    <Reveal className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-meetor-cyan" : "text-meetor-cyan-dark"}`}>{kicker}</p>
      <h2
        className={`mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl ${dark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/70" : "text-slate-600"}`}>{description}</p>
      )}
    </Reveal>
  );
}
