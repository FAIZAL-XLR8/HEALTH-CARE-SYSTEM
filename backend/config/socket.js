const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');

const initializeSocket = (io) => {
  // Middleware to authenticate JWT connection token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication token required.'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforextrasecurehealthauth12345');
      
      // Attempt to find in User or Doctor collection
      let account = await User.findById(decoded.id).select('-password');
      let role = 'patient';
      
      if (!account) {
        account = await Doctor.findById(decoded.id).select('-password');
        role = 'doctor';
      }
      
      if (!account) {
        return next(new Error('Account not found.'));
      }
      
      socket.user = account;
      socket.role = role;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Not authorized.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    const role = socket.role; // 'patient' or 'doctor'

    console.log(`🔌 Socket connected: User ${userId} (${role})`);

    // 1. Join Personal Room automatically on connection
    if (role === 'doctor') {
      socket.doctorId = userId;
      socket.join(`doctor:${userId}`);
      console.log(`👨‍⚕️ Doctor ${userId} joined personal room doctor:${userId}`);
      
      // Update online status
      await Doctor.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit('doctor-presence-update', { doctorId: userId, isOnline: true });
    } else {
      socket.join(`user:${userId}`);
      console.log(`👤 Patient ${userId} joined personal room user:${userId}`);
    }

    // 2. Join Appointment Room dynamically
    socket.on('join-appointment-room', async ({ appointmentId }) => {
      try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          return socket.emit('error', 'Appointment not found.');
        }

        // Security check
        const isPatient = appointment.patientId.toString() === userId;
        const isDoctor = appointment.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
          return socket.emit('error', 'Access denied to this consultation room.');
        }

        // Expiry check
        if (new Date() >= appointment.chatEnabledUntil) {
          return socket.emit('consultation-expired', { appointmentId });
        }

        socket.join(`appointment:${appointmentId}`);
        console.log(`🚪 User ${userId} joined appointment room appointment:${appointmentId}`);
        
        io.to(`appointment:${appointmentId}`).emit('participant-joined', { userId, role });
      } catch (err) {
        console.error('Error joining appointment room:', err);
        socket.emit('error', 'Error joining consultation room.');
      }
    });

    socket.on('leave-appointment-room', ({ appointmentId }) => {
      socket.leave(`appointment:${appointmentId}`);
      console.log(`🚪 User ${userId} left room appointment:${appointmentId}`);
    });

    // 3. Real-Time Chat Messaging
    socket.on('send-message', async ({ appointmentId, type, content, fileUrl, fileName }) => {
      try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return socket.emit('error', 'Appointment not found.');

        if (new Date() >= appointment.chatEnabledUntil) {
          socket.emit('consultation-expired', { appointmentId });
          socket.leave(`appointment:${appointmentId}`);
          return;
        }

        const receiverId = role === 'doctor' ? appointment.patientId : appointment.doctorId;

        // Map frontend attachment types to the required schema messageType enum: ['text', 'image', 'pdf', 'file']
        let messageType = 'text';
        if (type === 'image') messageType = 'image';
        else if (type === 'pdf') messageType = 'pdf';
        else if (type === 'file') messageType = 'file';

        const message = new Message({
          appointmentId,
          senderId: userId,
          receiverId,
          senderRole: role,
          messageType,
          content: content || '',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          isSeen: false,
        });

        await message.save();

        // Broadcast message to appointment room
        io.to(`appointment:${appointmentId}`).emit('receive-message', message);

        // Notify recipient in their personal room
        const receiverRoom = role === 'doctor' ? `user:${receiverId}` : `doctor:${receiverId}`;
        io.to(receiverRoom).emit('new-message-notification', {
          appointmentId,
          senderId: userId,
          senderName: socket.user.name,
          message: messageType === 'text' ? content : 'Sent an attachment',
        });
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', 'Failed to send message.');
      }
    });

    // 4. Typing Indicators
    socket.on('typing', ({ appointmentId }) => {
      socket.to(`appointment:${appointmentId}`).emit('typing', {
        senderId: userId,
        senderRole: role
      });
    });

    socket.on('stop-typing', ({ appointmentId }) => {
      socket.to(`appointment:${appointmentId}`).emit('stop-typing', {
        senderId: userId,
        senderRole: role
      });
    });

    // 5. Message Seen Receipt
    socket.on('mark-seen', async ({ appointmentId }) => {
      try {
        await Message.updateMany(
          { appointmentId, receiverId: userId, isSeen: false },
          { $set: { isSeen: true, seenAt: new Date() } }
        );
        socket.to(`appointment:${appointmentId}`).emit('messages-marked-seen', { appointmentId });
      } catch (err) {
        console.error('Error marking messages seen:', err);
      }
    });

    // 6. WebRTC Voice/Video Calling Signaling (Aligned with WhatsApp Clone)
    socket.on("initiate_call", ({ callerId, receiverId, callType, callerInfo }) => {
      const hasUserSocket = io.sockets.adapter.rooms.get(`user:${receiverId}`)?.size > 0;
      const hasDoctorSocket = io.sockets.adapter.rooms.get(`doctor:${receiverId}`)?.size > 0;

      if (hasUserSocket || hasDoctorSocket) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("incoming_call", {
          callerId,
          callerName: callerInfo?.username || callerInfo?.name || socket.user.name,
          callerAvatar: callerInfo?.profilePicture || callerInfo?.profileImage || '',
          callId,
          callType
        });
      } else {
        console.log(`server: Receiver ${receiverId} is offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    });

    socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
      const hasUserSocket = io.sockets.adapter.rooms.get(`user:${callerId}`)?.size > 0;
      const hasDoctorSocket = io.sockets.adapter.rooms.get(`doctor:${callerId}`)?.size > 0;

      if (hasUserSocket || hasDoctorSocket) {
        io.to([`user:${callerId}`, `doctor:${callerId}`]).emit("call_accepted", {
          callerName: receiverInfo?.username || receiverInfo?.name || socket.user.name,
          callerAvatar: receiverInfo?.profilePicture || receiverInfo?.profileImage || '',
          callId,
        });
      } else {
        console.log(`server: Caller ${callerId} is offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    });

    socket.on("reject_call", ({ callId, callerId }) => {
      io.to([`user:${callerId}`, `doctor:${callerId}`]).emit("call_rejected", { callId });
    });

    socket.on("end_call", ({ callId, participantId }) => {
      io.to([`user:${participantId}`, `doctor:${participantId}`]).emit("call_ended", { callId });
    });

    socket.on("webrtc_offer", ({ callId, offer, receiverId }) => {
      io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("webrtc_offer", {
        callId,
        offer,
        senderId: userId
      });
    });

    socket.on("webrtc_answer", ({ callId, answer, receiverId }) => {
      io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("webrtc_answer", {
        callId,
        answer,
        senderId: userId
      });
    });

    socket.on("webrtc_ice_candidate", ({ callId, candidate, receiverId }) => {
      io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("webrtc_ice_candidate", {
        callId,
        candidate,
        senderId: userId
      });
    });

    socket.on("disconnect_call", ({ callId, receiverId }) => {
      io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("call_disconnected", { callId });
    });

    socket.on("toggle_audio", ({ callId, receiverId, enabled }) => {
      io.to([`user:${receiverId}`, `doctor:${receiverId}`]).emit("remote_toggle_audio", { callId, enabled });
    });

    // Disconnect Handler
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: User ${userId}`);
      if (role === 'doctor') {
        const lastSeen = new Date();
        await Doctor.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        io.emit('doctor-presence-update', {
          doctorId: userId,
          isOnline: false,
          lastSeen,
        });
      }
    });
  });
};

module.exports = initializeSocket;
