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

const TelehealthRoom = ({ appointmentId, token, user, onBack }) => {
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

  const role = user.role; // 'patient' or 'doctor'

  // Initialize socket instance
  useEffect(() => {
    if (!token) return;
    const socketInstance = io('http://localhost:5000', {
      auth: { token }
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, [token, appointmentId]);

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
    token,
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, counterpartTyping]);

  // Bind WebRTC media streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-obsidian)', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden', margin: '20px auto', maxWidth: '1200px', width: '95%' }}>
      
      {/* 🟢 TOP ACTION HEADER PANEL */}
      <div style={{ background: 'rgba(7, 9, 19, 0.9)', borderBottom: '1px solid var(--card-border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <ArrowLeft size={20} />
          </button>
          
          <img
            src={counterpartPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${counterpartName}`}
            alt={counterpartName}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--card-border)' }}
          />

          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
              {role === 'doctor' ? counterpartName : `Dr. ${counterpartName.replace(/^Dr\.\s*/, '')}`}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {counterpartPresence.online ? (
                <>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-neon)' }} />
                  <span style={{ color: 'var(--secondary-neon)', fontWeight: 600 }}>Online</span>
                </>
              ) : (
                <span>
                  {formatLastSeen(counterpartPresence.lastSeen)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Start consultation voice/video call buttons */}
        {!isExpired && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleStartCall('voice')}
              style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.35)', color: 'var(--primary-neon)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', color: 'var(--secondary-neon)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.1)' }}>
            {messages.map(m => {
              const isOwnMessage = m.senderId === user.id || m.senderId === user._id;
              
              return (
                <div 
                  key={m._id} 
                  style={{
                    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    background: isOwnMessage ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isOwnMessage ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid var(--card-border)',
                    borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px',
                    color: '#fff'
                  }}
                >
                  {/* Media Content Types */}
                  {m.messageType === 'image' && (
                    <div style={{ marginBottom: '6px' }}>
                      <img 
                        src={m.fileUrl} 
                        alt="Attachment" 
                        onClick={() => setFullscreenImageUrl(m.fileUrl)}
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer', transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.target.style.opacity = 0.85}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
                      />
                    </div>
                  )}

                  {m.messageType === 'video' && (
                    <div style={{ marginBottom: '6px', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                      <video 
                        src={m.fileUrl} 
                        controls
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '240px', background: '#000', display: 'block' }}
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
                          border: '1px solid var(--card-border)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '6px' }}>
                      <FileText size={20} style={{ color: 'var(--accent-alert)' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.78rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '120px' }}>
                          {m.content}
                        </span>
                      </div>
                      <a 
                        href={m.fileUrl} 
                        download 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--primary-neon)', display: 'flex', padding: '4px' }}
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  )}

                  {(m.messageType === 'file' || m.messageType === 'raw') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '6px' }}>
                      <FileText size={20} style={{ color: 'var(--primary-neon)' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.78rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '120px' }}>
                          {m.content}
                        </span>
                      </div>
                      <a 
                        href={m.fileUrl} 
                        download 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--primary-neon)', display: 'flex', padding: '4px' }}
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  )}

                  {m.messageType === 'text' && (
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4', wordBreak: 'break-word' }}>{m.content}</p>
                  )}

                  {/* Message Bottom row: Timestamp + seen status check ticks */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {isOwnMessage && !isExpired && (
                      <button
                        onClick={() => handleDeleteMessage(m._id)}
                        title="Delete Message"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(244, 63, 94, 0.6)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 4px',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--accent-alert)'}
                        onMouseLeave={(e) => e.target.style.color = 'rgba(244, 63, 94, 0.6)'}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <span>{new Date(m.createdAt || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwnMessage && (
                      m.isSeen ? (
                        <CheckCheck size={12} style={{ color: 'var(--secondary-neon)' }} />
                      ) : (
                        <Check size={12} />
                      )
                    )}
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
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--card-border)' }} 
                />
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.s' }} />
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.2s' }} />
                  <span className="dot-blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'typingBlink 1.4s infinite both', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat input bar */}
          {!isExpired && (
            <form onSubmit={handleFormSubmit} style={{ background: 'rgba(7, 9, 19, 0.9)', borderTop: '1px solid var(--card-border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Attachment Preview panel */}
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px', position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
                  {filePreviewUrl ? (
                    <img src={filePreviewUrl} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} style={{ color: 'var(--primary-neon)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    disabled={uploading}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <X size={14} />
                  </button>
                  
                  {uploading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,6,12,0.85)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div className="spin-anim" style={{ width: '16px', height: '16px', border: '2px solid var(--primary-neon)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary-neon)', fontWeight: 600 }}>Uploading file...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Main Inputs row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', position: 'relative' }} ref={emojiPickerRef}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.pdf,.mp4,.webm,.mov,.avi"
                  onChange={handleAttachmentUpload}
                />
                
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'none', border: 'none', color: uploading ? 'var(--secondary-neon)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Paperclip size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ background: 'none', border: 'none', color: showEmojiPicker ? 'var(--primary-neon)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Smile size={20} />
                </button>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '50px', left: '0', zIndex: 110, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    <EmojiPicker 
                      theme="dark"
                      onEmojiClick={(emojiData) => {
                        setMessageText(prev => prev + emojiData.emoji);
                      }}
                      height={350}
                      width={320}
                    />
                  </div>
                )}

                <input
                  type="text"
                  value={messageText}
                  onChange={handleTyping}
                  disabled={uploading}
                  placeholder={selectedFile ? "Add a caption..." : "Type your message..."}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() && !selectedFile}
                  style={{
                    background: (messageText.trim() || selectedFile) ? 'var(--primary-neon)' : 'rgba(255,255,255,0.03)',
                    border: 'none',
                    color: (messageText.trim() || selectedFile) ? '#000' : 'var(--text-muted)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (messageText.trim() || selectedFile) ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
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
