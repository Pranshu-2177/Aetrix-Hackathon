import ChatUI from '@/components/chat/ChatUI';
import RoleTabs from '@/components/roles/RoleTabs';

export default function PatientsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <RoleTabs />

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 px-4 py-4 md:py-6">
        <section className="min-h-0 flex-1">
          <ChatUI
            embedded
            mode="patient"
            initialWelcome="Welcome. Tell me what the person is feeling. You can type or speak. I will help you understand whether travel may be needed."
          />
        </section>
      </main>
    </div>
  );
}
