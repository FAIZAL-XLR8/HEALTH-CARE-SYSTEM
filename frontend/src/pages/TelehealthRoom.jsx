import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  Phone, Video, VideoOff, Mic, MicOff, Send, Paperclip, X, Download,
  FileText, ArrowLeft, Monitor, PhoneOff, Check, CheckCheck, Trash2, Smile
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTelehealthCall } from '../hooks/useTelehealthCall';
import { useTelehealthChat } from '../hooks/useTelehealthChat';

const formatLastSeen = (dateString) => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Last seen today at ${timeStr}`;
  } else if (isYesterday) {
    return `Last seen yesterday at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `Last seen on ${dateStr} at ${timeStr}`;
  }
};

const TelehealthRoom = ({ appointmentId, user, onBack }) => {
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const role = user.role; // 'patient' or 'doctor'

  // Initialize socket instance
  useEffect(() => {
    const socketInstance = io('http://localhost:5000', {
      withCredentials: true
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, [appointmentId]);

  // Consume Chat Hook
  const {
    appointment,
    messages,
    messageText,
    setMessageText,
    counterpartPresence,
    isTyping,
    counterpartTyping,
    isExpired,
    uploading,
    selectedFile,
    filePreviewUrl,
    fullscreenImageUrl,
    setFullscreenImageUrl,
    fileInputRef,
    handleClearSelectedFile,
    handleSendMessage,
    handleDeleteMessage,
    handleTyping,
    handleAttachmentUpload,
    counterpartId
  } = useTelehealthChat({
    socket,
    user,
    appointmentId,
    role
  });

  const counterpartName = appointment
    ? (role === 'doctor' ? (appointment.userId?.name || appointment.patientId?.name || 'Patient') : (appointment.doctor?.name || 'Doctor'))
    : 'Consultation Room';

  const counterpartPhoto = appointment
    ? (role === 'doctor' ? (appointment.userId?.profileImage || appointment.patientId?.profileImage) : (appointment.doctor?.profileImage))
    : null;

  // Consume Call Hook
  const {
    callState,
    callType,
    callId,
    incomingCallData,
    localStream,
    remoteStream,
    micMuted,
    camOff,
    isScreenSharing,
    callDuration,
    handleStartCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    toggleMute,
    toggleCam,
    handleToggleScreenShare,
    formatCallTime
  } = useTelehealthCall({
    socket,
    user,
    counterpartId,
    counterpartName,
    counterpartPhoto,
    isExpired
  });

  // Scroll browser window to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to bottom on new messages (internal container only)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, counterpartTyping]);

  // Bind WebRTC media streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Close emoji picker on outside click
  const emojiPickerRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowEmojiPicker(false);
    handleSendMessage(e);
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 72px)', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#ffffff', 
      borderRadius: '0px', 
      border: 'none', 
      overflow: 'hidden', 
      margin: '0', 
      maxWidth: 'none', 
      width: '100%',
      boxShadow: 'none',
      color: '#111827'
    }}>
      
      {/* 🟢 TOP ACTION HEADER PANEL (Hinge Style) */}
      <div style={{ 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '18px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              color: '#64748b', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          
          <div style={{ position: 'relative' }}>
            <img
              src={counterpartPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${counterpartName}`}
              alt={counterpartName}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
            />
            {counterpartPresence.online && (
              <span style={{ 
                position: 'absolute', 
                bottom: '1px', 
                right: '1px', 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: '#10b981', 
                border: '2px solid #ffffff' 
              }} />
            )}
          </div>

          <div>
            <h4 style={{ color: '#1f2937', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
              {role === 'doctor' ? counterpartName : `Dr. ${counterpartName.replace(/^(?:Dr\.?\s*)+/i, '')}`}
            </h4>
            <div style={{ fontSize: '0.72rem', color: counterpartPresence.online ? '#10b981' : '#6b7280', fontWeight: 500, marginTop: '2px' }}>
              {counterpartPresence.online ? 'Active now' : formatLastSeen(counterpartPresence.lastSeen)}
            </div>
          </div>
        </div>

        {/* Start consultation voice/video call buttons */}
        {!isExpired && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleStartCall('voice')}
              title="Voice Call"
              style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                color: '#701557', 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(112, 21, 87, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(112, 21, 87, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              title="Video Call"
              style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                color: '#10b981', 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <Video size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 🔴 CONSULTATION ROOM MAIN TWO-PANE SECTION */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Left Pane: WhatsApp Chat Messages container */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>

          {/* Expiration Banner alert */}
          {isExpired && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', borderBottom: '1px solid var(--accent-alert)', color: 'var(--accent-alert)', padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
              Consultation Period Expired
            </div>
          )}

          {/* Messages list */}
          <div ref={messagesContainerRef} style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            background: '#f5f3f0' 
          }}>
            {messages.map(m => {
              const isOwnMessage = m.senderId === user.id || m.senderId === user._id;
              
              return (
                <div 
                  key={m._id} 
                  style={{
                    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '10px',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Left Avatar for partner messages only */}
                  {!isOwnMessage && (
                    <img 
                      src={counterpartPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${counterpartName}`} 
                      alt={counterpartName} 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        flexShrink: 0,
                        border: 'none'
                      }} 
                    />
                  )}

                  {/* Message bubble */}
                  <div
                    style={{
                      background: isOwnMessage ? '#701557' : '#ffffff',
                      border: 'none',
                      borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 16px',
                      color: isOwnMessage ? '#ffffff' : '#1f2937',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    {/* Media Content Types */}
                    {m.messageType === 'image' && (
                      <div style={{ marginBottom: '6px' }}>
                        <img 
                          src={m.fileUrl} 
                          alt="Attachment" 
                          onClick={() => setFullscreenImageUrl(m.fileUrl)}
                          style={{ maxWidth: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer', transition: 'opacity 0.2s' }}
                          onMouseEnter={(e) => e.target.style.opacity = 0.85}
                          onMouseLeave={(e) => e.target.style.opacity = 1}
                        />
                      </div>
                    )}

                    {m.messageType === 'video' && (
                      <div style={{ marginBottom: '6px', position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
                        <video 
                          src={m.fileUrl} 
                          controls
                          style={{ maxWidth: '100%', borderRadius: '10px', maxHeight: '240px', background: '#000', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFullscreenImageUrl(m.fileUrl)}
                          title="View Fullscreen"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(5, 6, 12, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: 0.8,
                            transition: 'opacity 0.2s',
                            zIndex: 5
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = 1}
                          onMouseLeave={(e) => e.target.style.opacity = 0.8}
                        >
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>⛶</span>
                        </button>
                      </div>
                    )}

                    {m.messageType === 'pdf' && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        background: 'rgba(0,0,0,0.05)', 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(0,0,0,0.08)', 
                        marginBottom: '6px' 
                      }}>
                        <FileText size={20} style={{ color: '#ef4444' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.78rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '120px', color: isOwnMessage ? '#fff' : '#1f2937' }}>
                            {m.content}
                          </span>
                        </div>
                        <a 
                          href={m.fileUrl} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: isOwnMessage ? '#a5f3fc' : '#0891b2', display: 'flex', padding: '4px' }}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}

                    {(m.messageType === 'file' || m.messageType === 'raw') && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        background: 'rgba(0,0,0,0.05)', 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(0,0,0,0.08)', 
                        marginBottom: '6px' 
                      }}>
                        <FileText size={20} style={{ color: isOwnMessage ? '#a5f3fc' : '#0891b2' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.78rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '120px', color: isOwnMessage ? '#fff' : '#1f2937' }}>
                            {m.content}
                          </span>
                        </div>
                        <a 
                          href={m.fileUrl} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: isOwnMessage ? '#a5f3fc' : '#0891b2', display: 'flex', padding: '4px' }}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}

                    {m.messageType === 'text' && (
                      <p style={{ fontSize: '0.88rem', lineHeight: '1.45', wordBreak: 'break-word', margin: 0 }}>{m.content}</p>
                    )}

                    {/* Message Bottom row: Timestamp + seen status check ticks */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      alignItems: 'center', 
                      gap: '6px', 
                      marginTop: '4px', 
                      fontSize: '0.65rem', 
                      color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'
                    }}>
                      {isOwnMessage && !isExpired && (
                        <button
                          onClick={() => handleDeleteMessage(m._id)}
                          title="Delete Message"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0',
                            marginRight: '2px',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#fecdd3'}
                          onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <span>{new Date(m.createdAt || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwnMessage && (
                        m.isSeen ? (
                          <CheckCheck size={11} style={{ color: '#a5f3fc' }} />
                        ) : (
                          <Check size={11} style={{ color: 'rgba(255,255,255,0.6)' }} />
                        )
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Animating Typing Status Bubble (WhatsApp style) */}
            {counterpartTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', margin: '4px 0', animation: 'fadeIn 0.2s ease-out' }}>
                <img 
                  src={counterpartPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${counterpartName}`} 
                  alt={counterpartName} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                />
                <div style={{
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7280', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0s' }} />
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7280', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.2s' }} />
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7280', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat input bar */}
          {!isExpired && (
            <form onSubmit={handleFormSubmit} style={{ 
              background: '#ffffff', 
              borderTop: '1px solid #e2e8f0', 
              padding: '16px 20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              
              {/* Attachment Preview panel */}
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} style={{ color: '#701557' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ color: '#1f2937', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    disabled={uploading}
                    style={{ background: '#f1f5f9', border: 'none', color: '#6b7280', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <X size={14} />
                  </button>
                  
                  {uploading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.9)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div className="spin-anim" style={{ width: '16px', height: '16px', border: '2px solid #701557', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.78rem', color: '#701557', fontWeight: 600 }}>Uploading file...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Main Inputs row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', position: 'relative' }} ref={emojiPickerRef}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.pdf,.mp4,.webm,.mov,.avi"
                  onChange={handleAttachmentUpload}
                />
                
                {/* Input Container Capsule */}
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: '#f3f4f6', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '24px', 
                  padding: '4px 6px 4px 16px',
                  gap: '8px'
                }}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={handleTyping}
                    disabled={uploading}
                    placeholder={selectedFile ? "Add a caption..." : "Type your message..."}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: '#1f2937',
                      fontSize: '0.85rem',
                      outline: 'none',
                      padding: '8px 0',
                      fontFamily: 'inherit'
                    }}
                  />

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Select Emoji"
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                  >
                    <Smile size={18} />
                  </button>
                </div>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '60px', left: '0', zIndex: 110, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
                    <EmojiPicker 
                      theme="light"
                      onEmojiClick={(emojiData) => {
                        setMessageText(prev => prev + emojiData.emoji);
                      }}
                      height={350}
                      width={320}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!messageText.trim() && !selectedFile}
                  style={{
                    background: (messageText.trim() || selectedFile) ? '#701557' : '#f3f4f6',
                    border: 'none',
                    color: (messageText.trim() || selectedFile) ? '#ffffff' : '#9ca3af',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (messageText.trim() || selectedFile) ? 'pointer' : 'default',
                    transition: 'all 0.25s',
                    boxShadow: (messageText.trim() || selectedFile) ? '0 4px 12px rgba(112, 21, 87, 0.2)' : 'none'
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Right Pane: Telehealth Consultation Video Overlay Call Pane */}
        {callState !== 'idle' && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(5, 6, 12, 0.95)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.3s ease-out'
          }}>

            {/* Incoming call screen dialog */}
            {callState === 'incoming' && incomingCallData && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <img
                  src={incomingCallData.callerAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${incomingCallData.callerName}`}
                  alt="Caller"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-neon)', animation: 'ring 1.5s infinite' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
                    {role === 'doctor' ? incomingCallData.callerName : `Dr. ${incomingCallData.callerName.replace(/^Dr\.\s*/, '')}`} is calling...
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <button
                    onClick={handleRejectCall}
                    style={{ background: 'var(--accent-alert)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <PhoneOff size={16} />
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    style={{ background: 'var(--secondary-neon)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Video size={16} />
                    Accept
                  </button>
                </div>
              </div>
            )}

            {/* Outgoing Ring call screen */}
            {callState === 'calling' && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <img
                  src={counterpartPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${counterpartName}`}
                  alt="Recipient"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-neon)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>Ringing...</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
                    Calling {role === 'doctor' ? counterpartName : `Dr. ${counterpartName.replace(/^Dr\.\s*/, '')}`}
                  </p>
                </div>
                <button
                  onClick={handleEndCall}
                  style={{ background: 'var(--accent-alert)', border: 'none', color: '#fff', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }}
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            )}

            {/* Connected Consult stream active call view overlay */}
            {callState === 'connected' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>

                {/* Visual Video feeds */}
                {callType === 'video' ? (
                  <div style={{ flex: 1, display: 'flex', gap: '16px', minHeight: 0, position: 'relative' }}>

                    {/* Remote screen */}
                    <div style={{ flex: 1, background: '#1c1917', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', position: 'relative' }}>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                        {role === 'doctor' ? counterpartName : `Dr. ${counterpartName.replace(/^Dr\.\s*/, '')}`}
                      </div>
                    </div>

                    {/* Local picture-in-picture stream */}
                    <div style={{ width: '160px', height: '120px', background: '#292524', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--primary-neon)', position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.55rem' }}>
                        You
                      </div>
                    </div>

                  </div>
                ) : (
                  // Voice Stream UI
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <Phone size={36} style={{ color: 'var(--primary-neon)' }} />
                    </div>
                    <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
                      {role === 'doctor' ? counterpartName : `Dr. ${counterpartName.replace(/^Dr\.\s*/, '')}`}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>Voice streaming active...</p>
                  </div>
                )}

                {/* Call Header info: timer duration */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-alert)', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{formatCallTime(callDuration)}</span>
                </div>

                {/* Stream media control panel buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                  <button
                    onClick={toggleMute}
                    style={{ background: micMuted ? 'var(--accent-alert)' : 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {callType === 'video' && (
                    <>
                      <button
                        onClick={toggleCam}
                        style={{ background: camOff ? 'var(--accent-alert)' : 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {camOff ? <VideoOff size={18} /> : <Video size={18} />}
                      </button>

                      <button
                        onClick={handleToggleScreenShare}
                        style={{ background: isScreenSharing ? 'var(--secondary-neon)' : 'rgba(255,255,255,0.08)', border: 'none', color: isScreenSharing ? '#000' : '#fff', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Monitor size={18} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleEndCall}
                    style={{ background: 'var(--accent-alert)', border: 'none', color: '#fff', padding: '0 24px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <PhoneOff size={18} />
                    End Call
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* 🖼️ Fullscreen Media Lightbox Modal */}
      {fullscreenImageUrl && (() => {
        const isVideo = fullscreenImageUrl.includes('/video/') ||
          fullscreenImageUrl.endsWith('.mp4') ||
          fullscreenImageUrl.endsWith('.webm') ||
          fullscreenImageUrl.endsWith('.mov') ||
          fullscreenImageUrl.endsWith('.avi');
        return (
          <div
            onClick={() => setFullscreenImageUrl(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(5, 6, 12, 0.95)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            <button
              onClick={() => setFullscreenImageUrl(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001
              }}
            >
              <X size={20} />
            </button>
            {isVideo ? (
              <video
                src={fullscreenImageUrl}
                controls
                autoPlay
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  cursor: 'default',
                  background: '#000'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={fullscreenImageUrl}
                alt="Fullscreen Attachment"
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  cursor: 'default'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ring {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
        .ring-anim {
          animation: ring 1.5s infinite;
        }
        @keyframes typingBlink {
          0% { opacity: 0.2; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(1); }
        }
        .dot-blink {
          animation: typingBlink 1.4s infinite both;
        }
      `}} />
    </div>
  );
};

export default TelehealthRoom;
