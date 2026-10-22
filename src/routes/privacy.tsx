import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BAR MATH" },
      {
        name: "description",
        content: "Privacy policy for the BAR MATH mobile app.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <main className="min-h-dvh bg-bg px-5 py-10 text-fg sm:px-8">
      <article className="mx-auto max-w-2xl space-y-7">
        <header className="space-y-3 border-b border-white/10 pb-6">
          <Link to="/" className="text-sm font-bold uppercase tracking-wider text-accent">
            ← BAR MATH
          </Link>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-fg">Effective September 17, 2026</p>
        </header>

        <section className="space-y-3">
          <p>
            Efficiency Strength Training, LLC operates BAR MATH. This policy explains what
            information the app processes, why it is used, and the choices available to you.
          </p>
        </section>

        <PolicySection title="Information we collect">
          <p>
            Most training progress and settings remain on your device. If you choose to submit a
            leaderboard score, we collect the display name you provide, an app-generated client
            identifier, score and accuracy information, game mode, difficulty, and submission time.
          </p>
          <p>
            Our service also processes network information and stores a short-lived, one-way hashed
            network identifier to prevent abuse and enforce rate limits. We do not use this
            information to identify you or for advertising.
          </p>
        </PolicySection>

        <PolicySection title="How we use information">
          <p>
            We use collected information only to operate leaderboards, show your ranking, maintain
            app functionality, protect the service, diagnose problems, and prevent fraud or abuse.
            We do not sell personal information or use it to track you across apps or websites.
          </p>
        </PolicySection>

        <PolicySection title="Public leaderboard information">
          <p>
            A submitted display name and score may be visible to other BAR MATH users. Do not use
            your full legal name or include contact or other sensitive information in your display
            name.
          </p>
        </PolicySection>

        <PolicySection title="Service providers and retention">
          <p>
            We use hosting and database providers to run the app. They process information on our
            behalf to provide those services. Leaderboard records are retained while needed to
            operate the leaderboard. Security rate-limit records are temporary. Local progress can
            be removed by clearing the app&apos;s data or deleting the app.
          </p>
        </PolicySection>

        <PolicySection title="Children">
          <p>
            BAR MATH is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13. If you believe a child has provided personal
            information, contact us so we can review and delete it where appropriate.
          </p>
        </PolicySection>

        <PolicySection title="Your choices">
          <p>
            Leaderboard submission is optional. You may use the app without submitting a display
            name or score. To request access to or deletion of leaderboard information associated
            with you, contact us using the information below and include the display name involved.
          </p>
        </PolicySection>

        <PolicySection title="Contact us">
          <p>
            Efficiency Strength Training, LLC<br />
            <a className="text-accent underline" href="mailto:bryan.jones@efficiencystrengthtraining.com">
              bryan.jones@efficiencystrengthtraining.com
            </a>
            <br />
            <a className="text-accent underline" href="tel:+13156638839">
              (315) 663-8839
            </a>
          </p>
        </PolicySection>

        <PolicySection title="Changes to this policy">
          <p>
            We may update this policy as the app changes. The effective date above will be updated
            when revisions are published.
          </p>
        </PolicySection>
      </article>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="space-y-3 leading-7 text-muted-fg">{children}</div>
    </section>
  );
}
