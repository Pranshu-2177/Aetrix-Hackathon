import ChatUI from '@/components/chat/ChatUI';

export default function PatientsPage() {
  return (
    <ChatUI
      mode="patient"
      initialWelcome="Welcome. Tell me what the person is feeling. You can type or speak. I will help you understand whether travel may be needed."
    />
  );
}
