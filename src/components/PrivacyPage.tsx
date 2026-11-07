// Static privacy policy, served at /privacy.
// Replace CONTACT_EMAIL before launch, and have the text reviewed (it is a template, not legal advice).

const CONTACT_EMAIL = "[your contact email]";
const LAST_UPDATED = "November 6, 2026";

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 leading-relaxed">
      <p>
        <a href="/" className="underline">
          ← Back to Cafe Pomodoro
        </a>
      </p>
      <h1 className="mt-4 text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-1 opacity-70">Last updated: {LAST_UPDATED}</p>

      <h2 className="mt-8 text-xl font-semibold">What this app is</h2>
      <p className="mt-2">
        Cafe Pomodoro is a free Pomodoro timer and to-do list. You can use it
        without an account, in which case everything stays in your browser. If you
        sign in with Google, your data is also saved to our server so it follows you
        across devices.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What we collect</h2>
      <ul className="mt-2 list-disc pl-6">
        <li>
          <strong>Google account info</strong> (when you sign in): your Google
          account ID, email address and name. We use these only to identify your
          account.
        </li>
        <li>
          <strong>Your app data</strong>: to-do items, timer settings and
          preferences (theme, sounds), and your focus statistics (minutes and
          sessions per day and hour).
        </li>
        <li>
          <strong>Notion connection</strong> (only if you connect Notion): an access
          token for the workspace you authorize, stored on our server and never sent
          to your browser. Task titles and due dates from your chosen database are
          copied into your to-do list. We never write to your Notion workspace.
        </li>
        <li>
          <strong>Cookies</strong>: strictly necessary sign-in cookies. We don&apos;t
          use advertising or analytics cookies.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">How we use it</h2>
      <p className="mt-2">
        Only to run the app: to sign you in and to save and sync your data. We do
        not sell your data, show ads, or use it for profiling.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Who processes it</h2>
      <ul className="mt-2 list-disc pl-6">
        <li>Google, for sign-in.</li>
        <li>Cloudflare, which runs our server and database.</li>
        <li>Vercel, which hosts the website.</li>
        <li>Notion, only if you connect it.</li>
      </ul>
      <p className="mt-2">
        These providers process data on our behalf under their own privacy terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Retention and deletion</h2>
      <p className="mt-2">
        We keep your data until you delete your account. Sign-in sessions expire
        after 30 days. You can delete your account and all associated data at any
        time with <em>Delete account</em> in the account menu, or by emailing{" "}
        {CONTACT_EMAIL}. Data stored only in your browser can be cleared from your
        browser settings.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Your rights</h2>
      <p className="mt-2">
        Depending on where you live, you may have the right to access, correct,
        export or delete your data. Email {CONTACT_EMAIL} and we&apos;ll help.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Children</h2>
      <p className="mt-2">
        The app is not directed at children under 13, and we don&apos;t knowingly
        collect their data.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Changes and contact</h2>
      <p className="mt-2">
        If this policy changes, we&apos;ll update the date above. Questions:{" "}
        {CONTACT_EMAIL}.
      </p>
    </main>
  );
}
