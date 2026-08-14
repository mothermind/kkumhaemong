import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.kkumhaemong.com";
const CONTACT_EMAIL = "account@kbeautyworldwide.com";

// Light scraper-obfuscation: numeric HTML entities decode fine in every
// browser and remain a real, clickable mailto link, but defeat naive
// plain-text/regex email harvesters that scan rendered HTML for a literal
// "user@domain.tld" string. Applied to both the href and the visible text.
function encodeForHtml(value: string): string {
  return value
    .split("")
    .map((char) => `&#${char.charCodeAt(0)};`)
    .join("");
}

function EmailLink({ label }: { label: string }) {
  const encodedEmail = encodeForHtml(CONTACT_EMAIL);
  const html = `<a href="mailto:${encodedEmail}" class="text-gold font-semibold hover:underline" aria-label="${label}">${encodedEmail}</a>`;
  // html is a fixed, code-owned constant (CONTACT_EMAIL), not user input.
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo ? "문의하기 - 꿈해몽" : "Contact - Kkumhaemong";
  const description = isKo
    ? "꿈해몽닷컴 문의 페이지입니다. 콘텐츠 오류 제보, 제휴 제안, 광고 문의 등 어떤 내용이든 이메일로 편하게 연락해 주세요. 최대한 빠르게 답변드립니다."
    : "Contact Kkumhaemong.com for corrections, partnership proposals, or advertising inquiries. Reach the site operator directly by email — every message is read.";
  const canonical = isKo ? `${BASE_URL}/ko/문의` : `${BASE_URL}/en/contact`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ko: `${BASE_URL}/ko/문의`,
        en: `${BASE_URL}/en/contact`,
        "x-default": `${BASE_URL}/en/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (isKo) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1
          className="text-2xl font-bold text-text-primary mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          문의하기
        </h1>
        <p className="text-sm text-text-muted mb-10">
          운영자에게 직접 연락하는 가장 빠른 방법입니다.
        </p>

        <div className="text-text-secondary space-y-8">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              이메일로 연락하기
            </h2>
            <p className="text-sm leading-relaxed text-text-muted mb-3">
              아래 이메일 주소로 언제든 연락해 주세요. 별도의 문의 양식이나
              회원가입 없이, 이메일 클라이언트가 바로 열립니다.
            </p>
            <p className="text-sm">
              <EmailLink label="꿈해몽닷컴 문의 이메일" />
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              어떤 내용을 보내주시면 되나요
            </h2>
            <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
              <li>콘텐츠 오류·오역 제보 (해석 내용, 번역, 오타 등)</li>
              <li>제휴 및 협업 제안</li>
              <li>광고 게재 문의</li>
              <li>개인정보 관련 문의</li>
              <li>그 외 사이트 운영에 대한 의견</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              더 알아보기
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              사이트에 대한 자세한 소개는{" "}
              <Link href="/about" className="text-gold hover:underline">
                소개 페이지
              </Link>
              를, 개인정보 처리 방식은{" "}
              <Link href="/privacy-policy" className="text-gold hover:underline">
                개인정보처리방침
              </Link>
              을 참고해 주세요.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1
        className="text-2xl font-bold text-text-primary mb-2"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Contact
      </h1>
      <p className="text-sm text-text-muted mb-10">
        The fastest way to reach the site operator directly.
      </p>

      <div className="text-text-secondary space-y-8">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Email Us
          </h2>
          <p className="text-sm leading-relaxed text-text-muted mb-3">
            Reach out any time at the address below — no contact form, no
            account required. Clicking it opens your email client directly.
          </p>
          <p className="text-sm">
            <EmailLink label="Kkumhaemong.com contact email" />
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            What to Contact Us About
          </h2>
          <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
            <li>Content corrections (interpretation, translation, typos)</li>
            <li>Partnership and collaboration proposals</li>
            <li>Advertising inquiries</li>
            <li>Privacy-related questions</li>
            <li>Any other feedback about the site</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Learn More
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            For more on the site, see our{" "}
            <Link href="/about" className="text-gold hover:underline">
              about page
            </Link>
            . For details on data handling, see our{" "}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
