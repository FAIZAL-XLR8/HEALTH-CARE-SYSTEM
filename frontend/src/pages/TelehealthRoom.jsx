import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { 
  Phone, Video, VideoOff, Mic, MicOff, Send, Paperclip, X, Download, 
  FileText, ArrowLeft, Monitor, PhoneOff, Check, CheckCheck, Trash2 
} from 'lucide-react';

const TelehealthRoom = ({ appointmentId, token, user, onBack }) => {
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [counterpartPresence, setCounterpartPresence] = useState({ online: false, lastSeen: null });
  const [isTyping, setIsTyping] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [uploading, setUploading] = useState(false);

  // WebRTC & Call states
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callType, setCallType] = useState('video'); // 'voice' | 'video'
  const [callId, setCallId] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const timerRef = useRef(null);
  const screenTrackRef = useRef(null);
  const localStreamRef = useRef(null);

  const role = user.role; // 'patient' or 'doctor'

  // Counterpart ID (recipient / sender)
  const counterpartId = appointment
    ? (role === 'doctor' 
        ? (appointment.patientId?._id || appointment.patientId || appointment.patient?._id || appointment.patient) 
        : (appointment.doctorId?._id || appointment.doctorId || appointment.doctor?._id || appointment.doctor)
      )
    : null;

  const counterpartName = appointment 
    ? (role === 'doctor' ? (appointment.userId?.name || appointment.patientId?.name || 'Patient') : (appointment.doctor?.name || 'Doctor'))
    : 'Consultation Room';

  const counterpartPhoto = appointment
    ? (role === 'doctor' ? (appointment.userId?.profileImage || appointment.patientId?.profileImage) : (appointment.doctor?.profileImage))
    : null;

  // 1. Fetch Chat History & Appointment details
  const fetchRoomData = async () => {
    try {
      // Fetch appointment details
      const apptRes = await fetch(`/api/appointments/patient/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const apptData = await apptRes.json();
      if (apptRes.ok) {
        let targetAppt = apptData.find(a => a._id === appointmentId);
        if (!targetAppt) {
          const docRes = await fetch(`/api/appointments/doctor/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const docData = await docRes.json();
          if (docRes.ok) {
            targetAppt = docData.appointments.find(a => a._id === appointmentId);
          }
        }
        
        if (targetAppt) {
          setAppointment(targetAppt);
          if (new Date() >= new Date(targetAppt.chatEnabledUntil)) {
            setIsExpired(true);
          }
        }
      }

      // Fetch chat messages
      const msgRes = await fetch(`/api/messages/${appointmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const msgData = await msgRes.json();
      if (msgRes.ok) {
        setMessages(msgData);
      }
    } catch (err) {
      console.error('Error fetching room details:', err);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [appointmentId]);

  // 2. Configure Socket.IO & Calling Listeners
  useEffect(() => {
    if (!appointmentId || !token) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Socket connected to signalling server');
      socket.emit('join-appointment-room', { appointmentId });
      socket.emit('mark-seen', { appointmentId });
    });

    socket.on('participant-joined', ({ userId }) => {
      if (userId !== user.id && userId !== user._id) {
        setCounterpartPresence({ online: true, lastSeen: null });
      }
    });

    socket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
      socket.emit('mark-seen', { appointmentId });
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socket.on('messages-marked-seen', () => {
      setMessages(prev => prev.map(m => m.senderId !== user.id && m.senderId !== user._id ? { ...m, seen: true } : m));
    });

    socket.on('doctor-presence-update', ({ doctorId, isOnline, lastSeen }) => {
      if (appointment && counterpartId === doctorId) {
        setCounterpartPresence({ online: isOnline, lastSeen });
      }
    });

    socket.on('typing', ({ senderRole }) => {
      if (senderRole !== role) {
        setCounterpartTyping(true);
      }
    });

    socket.on('stop-typing', ({ senderRole }) => {
      if (senderRole !== role) {
        setCounterpartTyping(false);
      }
    });

    socket.on('consultation-expired', () => {
      setIsExpired(true);
      cleanupCall();
    });

    // ==========================================
    // 📞 WebRTC CALL SIGNALING (WHATSAPP SIGNALS)
    // ==========================================
    socket.on("incoming_call", ({ callerId, callerName, callerAvatar, callType, callId }) => {
      setCallId(callId);
      setCallType(callType);
      setIncomingCallData({ callerId, callerName, callerAvatar });
      setCallState('incoming');
    });

    socket.on("call_accepted", async ({ callId: acceptedCallId }) => {
      setCallState('connected');
      startTimer();

      let stream = localStreamRef.current;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
          setLocalStream(stream);
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing media in call_accepted:", err);
          handleEndCall();
          return;
        }
      }

      const pc = createPeerConnection(acceptedCallId, counterpartId, stream);
      pcRef.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        callId: acceptedCallId,
        offer,
        receiverId: counterpartId
      });
    });

    socket.on("call_rejected", () => {
      alert("Call rejected by other user.");
      cleanupCall();
    });

    socket.on("call_ended", () => {
      cleanupCall();
    });

    socket.on("webrtc_offer", async ({ offer, senderId, callId: incomingCallId }) => {
      let stream = localStreamRef.current;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
          setLocalStream(stream);
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing media in webrtc_offer:", err);
          return;
        }
      }

      const pc = createPeerConnection(incomingCallId, senderId, stream);
      pcRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc_answer", {
        callId: incomingCallId,
        answer,
        receiverId: senderId
      });
    });

    socket.on("webrtc_answer", async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("webrtc_ice_candidate", async ({ candidate }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding remote ice candidate:', err);
      }
    });

    socket.on("remote_toggle_audio", ({ enabled }) => {
      console.log('Remote toggled audio:', enabled);
    });

    socket.on("call_failed", ({ reason }) => {
      alert(`Call failed: ${reason}`);
      cleanupCall();
    });

    socket.on("call_disconnected", () => {
      cleanupCall();
    });

    return () => {
      socket.disconnect();
      cleanupCall();
    };
  }, [appointmentId, token, appointment, counterpartId, callType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, counterpartTyping]);

  // Call timer interval
  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatCallTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. WebRTC Media Stream Handlers
  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
    }
    setRemoteStream(null);
  };

  const createPeerConnection = (cId, targetUserId, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc_ice_candidate", {
          callId: cId,
          candidate: event.candidate,
          receiverId: targetUserId
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    return pc;
  };

  // 4. Call Control Triggers
  const handleStartCall = async (type) => {
    if (isExpired || !counterpartId) return;
    setCallType(type);
    setCallState('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const generatedCallId = `${user.id || user._id}-${counterpartId}-${Date.now()}`;
      setCallId(generatedCallId);

      socketRef.current.emit("initiate_call", {
        callerId: user.id || user._id,
        receiverId: counterpartId,
        callType: type,
        callerInfo: {
          username: user.name,
          profilePicture: user.profileImage || ''
        }
      });
    } catch (err) {
      console.error(err);
      alert('Could not start call - failed to access camera/mic.');
      setCallState('idle');
    }
  };

  const handleAcceptCall = async () => {
    if (isExpired || !incomingCallData || !callId) return;
    setCallState('connected');
    startTimer();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socketRef.current.emit("accept_call", {
        callerId: incomingCallData.callerId,
        callId: callId,
        receiverInfo: {
          username: user.name,
          profilePicture: user.profileImage || ''
        }
      });
    } catch (err) {
      console.error(err);
      cleanupCall();
    }
  };

  const handleRejectCall = () => {
    if (socketRef.current && incomingCallData && callId) {
      socketRef.current.emit("reject_call", {
        callId,
        callerId: incomingCallData.callerId
      });
    }
    setCallState('idle');
    setIncomingCallData(null);
    setCallId(null);
  };

  const handleEndCall = () => {
    if (socketRef.current && callId && counterpartId) {
      socketRef.current.emit("end_call", {
        callId,
        participantId: counterpartId
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    stopTimer();
    stopMedia();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setCallState('idle');
    setIncomingCallData(null);
    setCallId(null);
  };

  // Audio mute toggle
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newEnabled = !audioTrack.enabled;
        audioTrack.enabled = newEnabled;
        setMicMuted(!newEnabled);

        socketRef.current?.emit("toggle_audio", {
          callId,
          receiverId: counterpartId,
          enabled: newEnabled
        });
      }
    }
  };

  // Video cam toggle
  const toggleCam = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newEnabled = !videoTrack.enabled;
        videoTrack.enabled = newEnabled;
        setCamOff(!newEnabled);
      }
    }
  };

  // Screen Sharing Track Replacement
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
        const videoTrack = stream.getVideoTracks()[0];

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }

        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(false);
      } catch (err) {
        console.error("Error reverting screen share to camera:", err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender && screenTrack) {
            sender.replaceTrack(screenTrack);
          }
        }

        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const newStream = new MediaStream([screenTrack]);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }

        const camVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camVideoTrack) {
          camVideoTrack.stop();
        }

        setLocalStream(newStream);
        localStreamRef.current = newStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        screenTrack.onended = () => {
          handleToggleScreenShare(); // revert when user stops clicking system screen share
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }
  };

  // 5. WhatsApp-like Chat event emitters
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (isExpired || !messageText.trim()) return;

    socketRef.current.emit('send-message', {
      appointmentId,
      type: 'text',
      content: messageText.trim()
    });

    setMessageText('');
    socketRef.current.emit('stop-typing', { appointmentId });
    setIsTyping(false);
  };

  const handleDeleteMessage = async (messageId) => {
    if (isExpired) return;
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        socketRef.current?.emit('delete-message', { appointmentId, messageId });
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete message.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting message.');
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (isExpired || !socketRef.current) return;

    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
      socketRef.current.emit('typing', { appointmentId });
    } else if (isTyping && e.target.value.trim() === '') {
      setIsTyping(false);
      socketRef.current.emit('stop-typing', { appointmentId });
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isExpired) return;

    const fileType = file.type || '';
    let msgType = 'file';
    if (fileType.includes('pdf')) {
      msgType = 'pdf';
    } else if (fileType.includes('image')) {
      msgType = 'image';
    } else if (fileType.includes('video')) {
      msgType = 'video';
    }

    const formData = new FormData();
    formData.append('media', file);
    formData.append('appointmentId', appointmentId);
    formData.append('type', msgType);

    setUploading(true);
    try {
      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        socketRef.current.emit('send-message', {
          appointmentId,
          type: msgType,
          content: file.name,
          fileUrl: data.fileUrl
        });
      } else {
        alert(data.message || 'File upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
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
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Dr. {counterpartName.replace('Dr. ', '')}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {counterpartPresence.online ? (
                <>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary-neon)' }} />
                  <span style={{ color: 'var(--secondary-neon)', fontWeight: 600 }}>Online</span>
                </>
              ) : (
                <span>
                  {counterpartPresence.lastSeen 
                    ? `Last seen ${new Date(counterpartPresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                    : 'Offline'}
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
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {m.messageType === 'video' && (
                    <div style={{ marginBottom: '6px' }}>
                      <video 
                        src={m.fileUrl} 
                        controls
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '240px', background: '#000' }}
                      />
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

            {/* Typing status check */}
            {counterpartTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.01)', padding: '8px 14px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                {role === 'doctor' ? 'Patient' : 'Doctor'} is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat input bar */}
          {!isExpired && (
            <form onSubmit={handleSendMessage} style={{ background: 'rgba(7, 9, 19, 0.9)', borderTop: '1px solid var(--card-border)', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              
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

              <input
                type="text"
                value={messageText}
                onChange={handleTyping}
                placeholder="Type your message..."
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
                disabled={!messageText.trim()}
                style={{
                  background: messageText.trim() ? 'var(--primary-neon)' : 'rgba(255,255,255,0.03)',
                  border: 'none',
                  color: messageText.trim() ? '#000' : 'var(--text-muted)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: messageText.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
              </button>

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
                    Dr. {incomingCallData.callerName.replace('Dr. ', '')} is calling...
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
                    Calling Dr. {counterpartName.replace('Dr. ', '')}
                  </p>
                </div>
                <button 
                  onClick={handleEndCall}
                  style={{ background: 'var(--accent-alert)', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <PhoneOff size={16} />
                  Cancel
                </button>
              </div>
            )}

            {/* Connected call streaming UI console */}
            {callState === 'connected' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Timer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', padding: '0 8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ACTIVE CONSULTATION • {callType.toUpperCase()} CALL
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--accent-alert)', fontWeight: 800, fontFamily: 'Outfit' }}>
                    {formatCallTime(callDuration)}
                  </span>
                </div>

                {/* Video Streams Grid */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: callType === 'video' ? '1fr 1fr' : '1fr', gap: '16px', position: 'relative' }}>
                  {callType === 'video' ? (
                    <>
                      {/* Local Cam View */}
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', background: '#000' }}>
                        <video 
                          ref={localVideoRef} 
                          autoPlay 
                          muted 
                          playsInline 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                          You {isScreenSharing ? '(Screen Sharing)' : ''}
                        </div>
                      </div>

                      {/* Remote Cam View */}
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', background: '#000' }}>
                        <video 
                          ref={remoteVideoRef} 
                          autoPlay 
                          playsInline 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                          Dr. {counterpartName.replace('Dr. ', '')}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Voice Call placeholder card
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyValue: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Phone size={36} style={{ color: 'var(--primary-neon)' }} />
                      </div>
                      <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>Dr. {counterpartName.replace('Dr. ', '')}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>Voice streaming active...</p>
                    </div>
                  )}
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
      `}} />
    </div>
  );
};

export default TelehealthRoom;
