import Image from "next/image";

const TYPE_STYLES = {
  auspicious: "border-l-4 border-emerald-400 bg-emerald-50",
  inauspicious: "border-l-4 border-red-400 bg-red-50",
  neutral: "border-l-4 border-gray-300 bg-gray-50",
} as const;

type Props = {
  heading: string;
  body: string;
  type: string;
  image?: string;
};

export function DreamSection({ heading, body, type, image }: Props) {
  const style =
    TYPE_STYLES[type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.neutral;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">{heading}</h2>
      <div className={`rounded-xl p-5 ${style}`}>
        {image && (
          <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg sm:h-52">
            <Image
              src={image}
              alt={heading}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}
        <p className="leading-relaxed text-gray-800">{body}</p>
      </div>
    </section>
  );
}
