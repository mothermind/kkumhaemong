import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "개인정보처리방침 - 꿈해몽" : "Privacy Policy - Kkumhaemong",
    robots: { index: false },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (isKo) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-serif)" }}>
          개인정보처리방침
        </h1>
        <p className="text-sm text-text-muted mb-10">최종 수정일: 2026년 3월 15일</p>

        <div className="prose prose-sm text-text-secondary space-y-8">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. 개요</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              꿈해몽 (kkumhaemong.com, 이하 "본 사이트")은 사용자의 개인정보를 소중히 여깁니다. 본 사이트는 회원가입, 로그인, 개인정보 수집 양식을 운영하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. 수집하는 정보</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              본 사이트는 직접적인 개인정보를 수집하지 않습니다. 다만 아래와 같은 방식으로 익명의 사용 데이터가 수집될 수 있습니다.
            </p>
            <ul className="text-sm text-text-muted list-disc list-inside mt-2 space-y-1">
              <li><strong>Vercel Analytics</strong>: 페이지뷰, 접속 국가, 디바이스 유형 등 집계된 익명 통계를 수집합니다. 개인 식별 정보는 수집하지 않습니다.</li>
              <li><strong>광고 쿠키 (Google AdSense / Kakao AdFit)</strong>: 광고 서비스 제공을 위해 제3자 광고 파트너가 쿠키를 사용할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. 광고 및 제3자 쿠키</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              본 사이트는 Google AdSense 및 Kakao AdFit 광고를 사용합니다. 이 광고 네트워크는 사용자의 관심사에 맞는 광고를 제공하기 위해 쿠키를 사용할 수 있습니다.
            </p>
            <ul className="text-sm text-text-muted list-disc list-inside mt-2 space-y-1">
              <li>Google의 광고 및 개인정보 정책: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">policies.google.com/privacy</a></li>
              <li>Google 광고 설정: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">adssettings.google.com</a></li>
            </ul>
            <p className="text-sm leading-relaxed text-text-muted mt-2">
              브라우저 설정에서 쿠키를 비활성화하거나 Google의 옵트아웃 플러그인을 통해 맞춤형 광고를 거부할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. 외부 링크</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              본 사이트는 외부 웹사이트로의 링크를 포함할 수 있으며, 해당 사이트의 개인정보처리방침에 대해서는 책임지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. 방침 변경</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              본 개인정보처리방침은 변경될 수 있으며, 변경 시 본 페이지의 수정일이 업데이트됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. 문의</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              개인정보 관련 문의사항은 사이트 내 피드백 채널을 통해 연락해 주세요.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-serif)" }}>
        Privacy Policy
      </h1>
      <p className="text-sm text-text-muted mb-10">Last updated: March 15, 2026</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">1. Overview</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            Kkumhaemong (kkumhaemong.com) is a Korean dream interpretation reference site. We do not operate user accounts, login systems, or data collection forms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">2. Information We Collect</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            We do not collect personal information directly. The following anonymous data may be collected:
          </p>
          <ul className="text-sm text-text-muted list-disc list-inside mt-2 space-y-1">
            <li><strong>Vercel Analytics</strong>: Aggregated, anonymous statistics including pageviews, country, and device type. No personally identifiable information is collected.</li>
            <li><strong>Advertising cookies (Google AdSense / Kakao AdFit)</strong>: Third-party ad partners may use cookies to serve relevant advertisements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">3. Advertising & Third-Party Cookies</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            This site uses Google AdSense and Kakao AdFit advertising. These networks may use cookies to serve interest-based ads.
          </p>
          <ul className="text-sm text-text-muted list-disc list-inside mt-2 space-y-1">
            <li>Google Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">policies.google.com/privacy</a></li>
            <li>Google Ad Settings: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">adssettings.google.com</a></li>
          </ul>
          <p className="text-sm leading-relaxed text-text-muted mt-2">
            You can opt out of personalized ads via your browser cookie settings or the Google opt-out plugin.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">4. External Links</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            This site may contain links to external websites. We are not responsible for the privacy practices of those sites.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">5. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            This policy may be updated from time to time. The "Last updated" date at the top of this page will reflect any changes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">6. Contact</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            For privacy-related questions, please reach out via the site feedback channel.
          </p>
        </section>
      </div>
    </div>
  );
}
