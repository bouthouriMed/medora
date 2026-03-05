import { useState, useEffect, useRef } from 'react';
import { useGetMessagesQuery, useGetConversationQuery, useSendMessageMutation, useGetUnreadCountQuery, useGetPatientsQuery, useGetUsersQuery } from '../api';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: allMessages = [] } = useGetMessagesQuery(undefined);
  const { data: conversation = [], refetch: refetchConversation } = useGetConversationQuery(selectedContact?.id, { skip: !selectedContact, pollingInterval: 10000 });
  const { data: unreadData } = useGetUnreadCountQuery(undefined, { pollingInterval: 15000 });
  const { data: patients = [] } = useGetPatientsQuery(undefined);
  const { data: users = [] } = useGetUsersQuery(undefined);
  const [sendMessage] = useSendMessageMutation();

  // Build contacts list from messages
  const contacts = (() => {
    const contactMap = new Map<string, { id: string; name: string; type: string; lastMessage: string; lastTime: string; unread: number }>();

    (allMessages as any[]).forEach((msg: any) => {
      const isFromMe = msg.senderId === user?.id;
      const contactId = isFromMe ? msg.receiverId : msg.senderId;
      const contactType = isFromMe ? msg.receiverType : msg.senderType;

      if (!contactMap.has(contactId)) {
        let name = contactId;
        if (contactType === 'PATIENT') {
          const p = (patients as any[]).find((p: any) => p.id === contactId);
          name = p ? `${p.firstName} ${p.lastName}` : contactId;
        } else {
          const u = (users as any[]).find((u: any) => u.id === contactId);
          name = u ? `${u.firstName} ${u.lastName}` : contactId;
        }
        contactMap.set(contactId, { id: contactId, name, type: contactType, lastMessage: msg.body, lastTime: msg.createdAt, unread: 0 });
      }

      const existing = contactMap.get(contactId)!;
      if (new Date(msg.createdAt) > new Date(existing.lastTime)) {
        existing.lastMessage = msg.body;
        existing.lastTime = msg.createdAt;
      }
      if (!isFromMe && !msg.isRead) existing.unread++;
    });

    return Array.from(contactMap.values()).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    await sendMessage({
      receiverId: selectedContact.id,
      receiverType: selectedContact.type,
      body: messageText.trim(),
      patientId: selectedContact.type === 'PATIENT' ? selectedContact.id : undefined,
    });
    setMessageText('');
    refetchConversation();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('messages.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('messages.subtitle')}</p>
        </div>
        {unreadData?.count > 0 && (
          <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
            {unreadData.count} {t('messages.unread')}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        <div className="grid grid-cols-3 h-full">
          {/* Contacts */}
          <div className="col-span-1 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('messages.conversations')}</h3>
            </div>
            {contacts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">{t('messages.noConversations')}</div>
            ) : contacts.map((c) => (
              <button key={c.id} onClick={() => setSelectedContact(c)}
                className={`w-full p-3 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedContact?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{c.name}</p>
                      {c.unread > 0 && <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">{c.unread}</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="col-span-2 flex flex-col">
            {selectedContact ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedContact.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{selectedContact.type}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(conversation as any[]).map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder={t('messages.typePlaceholder')}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                    {t('messages.send')}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="text-5xl block mb-3">💬</span>
                  <p className="font-medium">{t('messages.selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
