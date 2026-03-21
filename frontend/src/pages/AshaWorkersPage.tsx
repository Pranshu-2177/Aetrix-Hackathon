import ChatUI from '@/components/chat/ChatUI';
import RoleTabs from '@/components/roles/RoleTabs';

export default function AshaWorkersPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <RoleTabs />

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 px-4 py-4 md:py-6">
        <section className="min-h-0 flex-1">
          <ChatUI
            embedded
            mode="asha"
            initialWelcome="ASHA worker mode. Please include age, village, days of illness, and any danger signs. Example: woman, 52, fever for 3 days, vomiting, from Bareja."
          />
        </section>
      </main>
    </div>
  );
}
