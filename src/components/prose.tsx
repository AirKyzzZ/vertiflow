export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 lg:px-10 lg:py-28 [&_a]:text-accent [&_a]:underline [&_h1]:display [&_h1]:mb-10 [&_h1]:text-4xl [&_h2]:display [&_h2]:mb-4 [&_h2]:mt-14 [&_h2]:text-xl [&_li]:mb-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-neutral-700 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  )
}
