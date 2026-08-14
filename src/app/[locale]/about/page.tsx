import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.kkumhaemong.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo ? "사이트 소개 - 꿈해몽" : "About - Kkumhaemong";
  const description = isKo
    ? "꿈해몽닷컴은 920여 개 꿈 상징을 다루는 한국어·영어 꿈해몽 사이트입니다. 전통 길몽·흉몽 해석과 문화적 배경, 현대 심리학 관점을 함께 담았습니다."
    : "Kkumhaemong.com is a bilingual Korean dream interpretation reference covering 920+ symbols, blending traditional folk meanings with modern psychology.";
  const canonical = isKo ? `${BASE_URL}/ko/소개` : `${BASE_URL}/en/about`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ko: `${BASE_URL}/ko/소개`,
        en: `${BASE_URL}/en/about`,
        "x-default": `${BASE_URL}/en/about`,
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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (isKo) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1
          className="text-2xl font-bold text-text-primary mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          사이트 소개
        </h1>
        <p className="text-sm text-text-muted mb-10">
          한국 전통 꿈해몽과 현대적 해석을 함께 다루는 꿈해몽 전문 사이트입니다.
        </p>

        <div className="text-text-secondary space-y-8">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              꿈해몽닷컴은 어떤 사이트인가요
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              꿈해몽닷컴(kkumhaemong.com)은 동물, 사람, 자연, 재물, 죽음 등 24개
              카테고리에 걸쳐 920여 개의 꿈 상징을 다루는 한국어·영어 꿈해몽
              자료 사이트입니다. 높은 검색량의 대표 상징부터 특정 상황·색상·수량에
              따른 세부 변주까지 폭넓게 정리해, 어떤 꿈을 꾸었든 원하는 해석을
              찾을 수 있도록 구성했습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              편집 원칙
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              각 상징은 길몽(吉夢)과 흉몽(凶夢), 중립적 해석을 함께 제시하고,
              한국 전통 민속 해몽의 유래와 문화적 배경을 설명합니다. 여기에
              더해 서구 심리학적 관점(칼 융의 상징 이론 등)도 함께 소개해,
              전통과 현대적 시각을 균형 있게 담으려 노력합니다. 페이지 수를
              늘리기보다 한 편 한 편을 깊이 있게 완성하는 것을 편집 원칙으로
              삼고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              참고용 콘텐츠 안내
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              꿈해몽닷컴의 모든 해석은 한국 전통 민속 신앙과 심리학적 관점을
              바탕으로 한 문화적 참고 자료이며, 미래를 예측하거나 특정 결정을
              대신하는 점술·운세 서비스가 아닙니다. 의료, 법률, 재정 등
              전문적인 판단이 필요한 사안은 반드시 해당 분야 전문가와
              상담해 주세요.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              문의 및 개인정보
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              콘텐츠 오류 제보, 제휴 제안, 광고 문의 등은{" "}
              <Link href="/contact" className="text-gold hover:underline">
                문의 페이지
              </Link>
              를 통해 연락해 주세요. 개인정보 처리 방식은{" "}
              <Link href="/privacy-policy" className="text-gold hover:underline">
                개인정보처리방침
              </Link>
              에서 확인하실 수 있습니다.
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
        About Kkumhaemong
      </h1>
      <p className="text-sm text-text-muted mb-10">
        A dedicated resource for traditional Korean dream interpretation and
        modern context.
      </p>

      <div className="text-text-secondary space-y-8">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            What Kkumhaemong.com Is
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            Kkumhaemong.com (kkumhaemong.com) is a bilingual Korean dream
            interpretation reference covering 920+ symbols across 24
            categories — animals, people, nature, money, death, and more. It
            spans everything from high-search-volume symbols to long-tail
            variations by color, action, or situation, so readers can find a
            close match for the dream they actually had.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Our Editorial Approach
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            Each symbol presents auspicious (길몽) and inauspicious (흉몽)
            interpretations alongside neutral, context-dependent readings,
            with the traditional Korean folk origin explained for
            international readers. We pair this with a modern psychological
            lens — including Jungian dream-symbol theory — so the site
            balances traditional and contemporary perspectives. We favor
            depth over volume: every article is meant to stand on its own as
            a complete piece of reference material.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            For Reference, Not Fortune-Telling
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            Every interpretation on Kkumhaemong.com is cultural reference
            material grounded in Korean folk tradition and psychological
            theory — it is not a fortune-telling service and does not
            predict outcomes or substitute for professional advice. Please
            consult a qualified professional for medical, legal, or
            financial decisions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Contact & Privacy
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            For corrections, partnership proposals, or advertising
            inquiries, reach out via the{" "}
            <Link href="/contact" className="text-gold hover:underline">
              contact page
            </Link>
            . See our{" "}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              privacy policy
            </Link>{" "}
            for details on how we handle data.
          </p>
        </section>
      </div>
    </div>
  );
}
