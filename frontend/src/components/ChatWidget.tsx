import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import apiService from '../services/api';
import { Paperclip, Send, MessageSquare, X, Sparkles } from 'lucide-react';
import '../SereneWellness.css';

interface MessageItem {
  _id?: string;
  relationshipId: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  clientMessageId?: string;
  isRead?: boolean;
  readAt?: Date;
  deliveredAt?: Date;
}

interface ChatWidgetProps {
  className?: string;
}

export interface ChatWidgetRef {
  openChat: (relationshipId: string) => void;
}

const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>((props, ref) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const [threads, setThreads] = useState<Record<string, MessageItem[]>>({});
  const [doctorPatients, setDoctorPatients] = useState<{ id: string; name: string; relationshipId?: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isOpen && 
        widgetRef.current && 
        !widgetRef.current.contains(target) &&
        (!buttonRef.current || !buttonRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { 
    isConnected, 
    joinRelationship, 
    sendMessage, 
    sendTypingIndicator, 
    markMessagesAsRead, 
    loadChatHistory 
  } = useWebSocket({
    userId: user?.id || '',
    userRole: (user?.role as any) || 'patient',
    token: localStorage.getItem('authToken') || ''
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openChat: (relationshipId: string) => {
      setActiveRelationshipId(relationshipId);
      setIsOpen(true);
      joinRelationship(relationshipId);
    }
  }));

  // Load relationships
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        if (user.role === 'patient') {
          const res = await apiService.getPatientConnectionStatus();
          if (res.success && res.data?.relationshipId) {
            setActiveRelationshipId(res.data.relationshipId);
            joinRelationship(res.data.relationshipId);
            loadChatHistory(res.data.relationshipId);
          }
        } else if (user.role === 'doctor') {
          const res = await apiService.getPatients();
          if (res.success) {
            setDoctorPatients(res.data || []);
            const first = (res.data || []).find(p => p.relationshipId);
            if (!activeRelationshipId && first?.relationshipId) {
              setActiveRelationshipId(first.relationshipId);
              joinRelationship(first.relationshipId);
              loadChatHistory(first.relationshipId);
            }
          }
        }
      } catch (e) {
        
      }
    };
    load();
  }, [user, joinRelationship, activeRelationshipId, loadChatHistory]);

  // Event Listeners for WebSocket
  useEffect(() => {
    const messageHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const msg = e.detail as MessageItem;
      if (!msg?.relationshipId) return;
      
      setThreads(prev => {
        const list = prev[msg.relationshipId] || [];
        const exists = list.some(m => 
          m.clientMessageId === msg.clientMessageId || (m._id && m._id === msg._id)
        );
        if (exists) return prev;
        return { ...prev, [msg.relationshipId]: list.concat(msg) };
      });
      
      if (msg.clientMessageId) {
        setPendingMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(msg.clientMessageId!);
          return newSet;
        });
      }
      
      if (!isOpen && msg.senderId !== user?.id) setIsOpen(true);
      
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 100);
    };

    const chatHistoryHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const { relationshipId, messages } = e.detail;
      if (!relationshipId || !messages) return;
      
      setThreads(prev => ({ ...prev, [relationshipId]: messages }));
      
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 100);
    };

    const typingHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const { relationshipId, senderId, isTyping: userIsTyping } = e.detail;
      if (!relationshipId || !senderId || senderId === user?.id) return;
      
      setTypingUsers(prev => {
        const current = prev[relationshipId] || [];
        if (userIsTyping) {
          return { ...prev, [relationshipId]: Array.from(new Set([...current, senderId])) };
        } else {
          return { ...prev, [relationshipId]: current.filter(id => id !== senderId) };
        }
      });
    };

    window.addEventListener('websocket-message', messageHandler as EventListener);
    window.addEventListener('websocket-chat-history', chatHistoryHandler as EventListener);
    window.addEventListener('websocket-typing', typingHandler as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', messageHandler as EventListener);
      window.removeEventListener('websocket-chat-history', chatHistoryHandler as EventListener);
      window.removeEventListener('websocket-typing', typingHandler as EventListener);
    };
  }, [isOpen, user?.id]);

  const currentThread = useMemo(() => (activeRelationshipId ? threads[activeRelationshipId] || [] : []), [threads, activeRelationshipId]);
  const canSend = isConnected && activeRelationshipId && composeText.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!user || !activeRelationshipId || !composeText.trim()) return;
    const text = composeText.trim();
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    setPendingMessages(prev => new Set(prev).add(clientMessageId));
    
    const temp: MessageItem = {
      relationshipId: activeRelationshipId,
      senderId: user.id,
      recipientId: 'unknown',
      text,
      timestamp: Date.now(),
      clientMessageId,
      isRead: false
    };
    
    setThreads(prev => ({
      ...prev,
      [activeRelationshipId]: (prev[activeRelationshipId] || []).concat(temp)
    }));
    setComposeText('');
    
    if (isTyping) {
      sendTypingIndicator(activeRelationshipId, false);
      setIsTyping(false);
    }
    
    sendMessage('relationship_send', {
      relationshipId: activeRelationshipId,
      senderId: user.id,
      recipientId: '',
      text,
      clientMessageId
    });

    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 100);
  }, [user, activeRelationshipId, composeText, sendMessage, sendTypingIndicator, isTyping]);

  const handleTyping = useCallback((text: string) => {
    if (!activeRelationshipId) return;
    const isCurrentlyTyping = text.trim().length > 0;
    
    if (isCurrentlyTyping && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeRelationshipId, true);
    } else if (!isCurrentlyTyping && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeRelationshipId, false);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(activeRelationshipId, false);
      }, 3000);
    }
  }, [activeRelationshipId, isTyping, sendTypingIndicator]);

  useEffect(() => {
    if (!activeRelationshipId || !isOpen) return;
    const unread = currentThread.filter(msg => msg.recipientId === user?.id && !msg.isRead && msg._id);
    if (unread.length > 0) {
      markMessagesAsRead(activeRelationshipId, unread.map(m => m._id!));
    }
  }, [activeRelationshipId, isOpen, currentThread, user?.id, markMessagesAsRead]);

  return (
    <>
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(s => !s)}
          className={`fixed bottom-6 right-6 z-50 rounded-2xl shadow-xl transition-all duration-500 flex items-center justify-center group bg-violet-600 hover:bg-violet-700 w-14 h-14`}
          title="Chat"
          data-chat-button
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 border-2 border-violet-600 rounded-full" />
            )}
          </div>
        </button>
      )}
 
      {isOpen && (
        <div 
          ref={widgetRef}
          className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[92vw] h-[550px] max-h-[80vh] flex flex-col bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
          onClick={(e) => e.stopPropagation()}
          data-chat-widget
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600/5 to-rose-600/5 border-b border-white/60 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm mr-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-none">
                  {user?.role === 'doctor' ? 'Patient Console' : 'Clinical Support'}
                </h3>
                <div className="flex items-center mt-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full mr-2 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {isConnected ? 'Connection Active' : 'Establishing...'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-gray-100/50 text-gray-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Thread List (Doctor only) */}
            {user?.role === 'doctor' && doctorPatients.length > 0 && (
              <div className="w-24 sm:w-32 border-r border-white/60 bg-gray-50/30 overflow-y-auto py-2">
                {doctorPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => p.relationshipId && setActiveRelationshipId(p.relationshipId)}
                    className={`w-full px-3 py-4 text-left transition-all ${
                      activeRelationshipId === p.relationshipId 
                        ? 'bg-white border-y border-white/80 shadow-sm' 
                        : 'hover:bg-white/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 mb-2 flex items-center justify-center text-[10px] font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 truncate w-full">{p.name.split(' ')[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 flex flex-col bg-white/40">
              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentThread.length > 0 ? (
                  currentThread.map((m, idx) => {
                    const mine = m.senderId === user?.id;
                    const isPending = pendingMessages.has(m.clientMessageId || '');
                    return (
                      <div key={m._id || m.clientMessageId || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all duration-300 ${
                            mine 
                              ? 'bg-violet-600 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                          } ${isPending ? 'opacity-60 scale-95' : ''}`}>
                            {m.text}
                          </div>
                          <div className={`mt-1 flex items-center gap-2 px-1 text-[9px] font-bold uppercase tracking-wider ${mine ? 'justify-end text-gray-400' : 'text-gray-400'}`}>
                            <span>{new Date(m.timestamp || (m as any).createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {mine && (
                              <span className="flex items-center">
                                {isPending ? '···' : m.isRead ? 'Seen' : 'Sent'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-8">
                    <div className="p-4 rounded-full bg-gray-100 mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Private Secure Line
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Messages are encrypted and visible only to you and your clinical partner.
                    </p>
                  </div>
                )}
                
                {/* Typing indicator */}
                {activeRelationshipId && typingUsers[activeRelationshipId]?.length > 0 && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
                    <div className="px-4 py-2 rounded-2xl bg-gray-100/50 text-gray-500 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/60">
                <div className="relative flex items-end gap-2">
                  <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                    <textarea
                      rows={1}
                      value={composeText}
                      onChange={(e) => {
                        setComposeText(e.target.value);
                        handleTyping(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (canSend) handleSend();
                        }
                      }}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 placeholder:text-gray-400 font-medium"
                      placeholder="Type your message..."
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-200/50 text-gray-400 transition-colors">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <span className="text-[9px] font-bold text-gray-300 uppercase">Press Enter to Send</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`h-[46px] w-[46px] rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                      canSend 
                        ? 'bg-violet-600 text-white shadow-violet-200 hover:scale-105 active:scale-95' 
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Send className="h-5 w-5 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';
export default ChatWidget;
