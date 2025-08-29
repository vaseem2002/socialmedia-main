import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { UserContext } from '../context/userContext';
import axiosInstance from '../utils/axiosInstance';
import { assets } from '../assets/assets';
import GroupMembers from '../components/GroupMembers';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send,
  Image as ImageIcon,
  VideoCameraBack,
  ArrowBack,
  People,
  ExitToApp,
  MoreVert,
  Edit,
  Delete,
  Close,
  AddPhotoAlternate,
  Cancel,
  AdminPanelSettings,
  Warning
} from '@mui/icons-material';
import socket from '../socketConnection';
import moment from 'moment';
import { toast } from 'react-toastify';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State variables
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [members, setMembers] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Add this line
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [groupRes, messagesRes, membersRes] = await Promise.all([
          axiosInstance.get(`/api/groups/${groupId}`),
          axiosInstance.get(`/api/groups/${groupId}/messages`),
          axiosInstance.get(`/api/groups/${groupId}/members`),
        ]);

         // Add read status to messages
      const messagesWithReadStatus = messagesRes.data.map(msg => ({
        ...msg,
        isRead: msg.sender._id === user._id || msg.readBy?.includes(user._id)
      }));

        setGroup(groupRes.data);
        setGroupName(groupRes.data.name);
        setGroupDescription(groupRes.data.description);
        // setMessages(messagesRes.data || []);
        setMessages(messagesWithReadStatus);
        setMembers(membersRes.data || []);

         // Calculate unread count
      const unread = messagesWithReadStatus.filter(m => !m.isRead && m.sender._id !== user._id).length;
      setUnreadCount(unread);


        const currentUserMember = membersRes.data.find(
          (m) => m.user._id === user._id
        );
        setIsAdmin(currentUserMember?.role === 'admin');
      } catch (error) {
        console.error('Failed to fetch group data:', error);
        setError(error.response?.data?.message || error.message);
        toast.error('Failed to load group data');
        if (error.response?.status === 404) {
          navigate('/chats');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();

    // Socket listeners
    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (!prev.some((m) => m._id === message._id)) {
          return [...prev, message];
        }
        return prev;
      });
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    };

    const handleMessageDeleted = (deletedMessageId) => {
      setMessages(prev => prev.filter(msg => msg._id !== deletedMessageId));
    };

    socket.on('groupMessage', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('message_deleted', handleMessageDeleted);
    socket.emit('joinGroup', groupId);

    return () => {
      socket.off('groupMessage', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.emit('leaveGroup', groupId);
    };
  }, [groupId, token, user._id, navigate]);

  // Message functions
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axiosInstance.post(
        `/api/groups/${groupId}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage('');
      socket.emit('groupMessage', res.data);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  }, [newMessage, groupId, token]);

  const handleUpdateMessage = useCallback(async () => {
    if (!editingMessage || !newMessage.trim()) return;

    try {
      const res = await axiosInstance.put(
        `/api/groups/messages/${editingMessage._id}`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(messages.map(msg => 
        msg._id === editingMessage._id ? res.data : msg
      ));
      setEditingMessage(null);
      setNewMessage('');
      toast.success('Message updated');
      socket.emit('message_updated', res.data);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to update message:', error);
      toast.error(error.response?.data?.message || 'Failed to update message');
    }
  }, [editingMessage, newMessage, messages, token]);

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await axiosInstance.delete(
        `/api/groups/messages/${selectedMessage._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(messages.filter(msg => msg._id !== selectedMessage._id));
      setDeleteDialogOpen(false);
      toast.success('Message deleted');
      socket.emit('message_deleted', selectedMessage._id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
    } finally {
      setSelectedMessage(null);
    }
  };
  const markMessagesAsRead = useCallback(async () => {
    try {
      await axiosInstance.put(
        `/api/groups/${groupId}/messages/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setMessages(prev => prev.map(msg => ({
        ...msg,
        isRead: true
      })));
      setUnreadCount(0);
      socket.emit('markMessagesRead', groupId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [groupId, token]);

  const handleStartEditing = useCallback((message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditingMessage(null);
    setNewMessage('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Media handling
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `File too large. Max ${type === 'image' ? '5MB' : '20MB'} allowed`
      );
      return;
    }

    setMediaFile(file);
    setMediaType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMedia = async () => {
    if (!mediaFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('type', mediaType);

      const res = await axiosInstance.post(
        `/api/groups/${groupId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit('groupMessage', res.data);
      setMediaPreview(null);
      setMediaFile(null);
      setMediaType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to upload media:', error);
      toast.error(error.response?.data?.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  // Group management
  const handleLeaveGroup = async () => {
    try {
      await axiosInstance.delete(`/api/groups/${groupId}/members/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('You have left the group');
      socket.emit('groupActivity', {
        groupId,
        type: 'member_left',
        userId: user._id,
        username: user.username
      });
      navigate('/chats');
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', groupDescription);

      if (groupAvatar instanceof File) {
        formData.append('avatar', groupAvatar);
      }

      const res = await axiosInstance.patch(
        `/api/groups/${groupId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGroup((prev) => ({ ...prev, ...res.data }));
      toast.success('Group updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error(error.response?.data?.message || 'Failed to update group');
    }
  };

  // UI handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGroupAvatar(file);
  };

  // Message component
  const MessageItem = React.memo(({ message }) => {
    const isCurrentUser = message.sender._id === user._id;
    const canEdit = isCurrentUser && 
                   moment().diff(moment(message.createdAt), 'hours') < 1;
    const canDelete = isCurrentUser || isAdmin;

    return (
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
          position: 'relative',
          '&:hover .message-actions': {
            opacity: 1,
          }
        }}
      >
         {/* Add the unread indicator */}
      {!message.isRead && !isCurrentUser && (
        <Box sx={{
          position: 'absolute',
          top: -5,
          right: isCurrentUser ? -10 : 'auto',
          left: isCurrentUser ? 'auto' : -10,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.main
        }} />
      )}
      
        {(canEdit || canDelete) && (
          <Box
            className="message-actions"
            sx={{
              position: 'absolute',
              top: -20,
              right: isCurrentUser ? 0 : 'auto',
              left: isCurrentUser ? 'auto' : 0,
              display: 'flex',
              gap: 0.5,
              opacity: 0,
              transition: 'opacity 0.2s',
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              p: 0.5,
              boxShadow: 1,
              zIndex: 1
            }}
          >
            {canEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => handleStartEditing(message)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedMessage(message);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Delete fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        <Box
          sx={{
            maxWidth: isMobile ? '90%' : '70%',
            borderRadius: 4,
            p: 2,
            backgroundColor: isCurrentUser
              ? theme.palette.primary.main
              : theme.palette.mode === 'dark'
              ? '#333'
              : '#f5f5f5',
            color: isCurrentUser
              ? theme.palette.primary.contrastText
              : theme.palette.text.primary,
            boxShadow: theme.shadows[1],
            position: 'relative'
          }}
        >
          {message.sender._id !== user._id && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                src={message.sender?.profilePicture || assets.noAvatar}
                sx={{ width: 32, height: 32, mr: 1 }}
                imgProps={{
                  onError: (e) => {
                    e.target.src = assets.noAvatar;
                    e.target.onerror = null;
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {message.sender?.username || 'Unknown'}
              </Typography>
            </Box>
          )}

          {message.media ? (
            message.mediaType === 'image' ? (
              <Box
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  my: 0.5,
                  position: 'relative',
                  backgroundColor: theme.palette.action.hover,
                }}
              >
                <img
                  src={message.media}
                  alt="Chat image"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.src = assets.noCoverPicture;
                    e.target.alt = 'Failed to load image';
                    e.target.onerror = null;
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  my: 0.5,
                  position: 'relative',
                }}
              >
                <video
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    backgroundColor: theme.palette.action.hover,
                  }}
                  poster={assets.imageIcon}
                  onError={(e) => {
                    e.target.poster = assets.noCoverPicture;
                    e.target.innerHTML = `
                      <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: ${theme.palette.action.hover};
                        color: ${theme.palette.text.secondary};
                      ">
                        <div>
                          <img 
                            src="${assets.videoIcon}" 
                            alt="Video not supported" 
                            style="width: 48px; height: 48px; opacity: 0.7;"
                          />
                          <p>Video not available</p>
                        </div>
                      </div>
                    `;
                    e.target.onerror = null;
                  }}
                >
                  <source
                    src={message.media}
                    type={`video/${message.mediaType || 'mp4'}`}
                  />
                </video>
              </Box>
            )
          ) : (
            <Typography
              variant="body1"
              sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              {message.content}
            </Typography>
          )}

          <Typography
            variant="caption"
            display="block"
            textAlign="right"
            sx={{ mt: 0.5 }}
          >
            {moment(message.createdAt).format('h:mm A')}
            {message.editedAt && (
              <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>
                (edited)
              </span>
            )}
          </Typography>
        </Box>
      </Box>
    );
  });

  useEffect(() => {
    const currentInput = inputRef.current;
    if (currentInput) {
      currentInput.focus();
    }
  }, [messages]);

  // Message input component
  const MessageInput = React.memo(() => {
    useEffect(() => {
      if (!editingMessage) {
        inputRef.current?.focus();
      }
    }, [editingMessage]);

    useEffect(() => {
      const handleScroll = () => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          // If scrolled to bottom (within 50px)
          if (scrollHeight - scrollTop - clientHeight < 50) {
            markMessagesAsRead();
          }
        }
      };
    
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
      }
    }, [markMessagesAsRead]);

    return (
      <Box
        component="form"
        onSubmit={editingMessage ? handleUpdateMessage : handleSendMessage}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2],
        }}
      >
        {editingMessage && (
          <Box
            sx={{
              mb: 1,
              p: 1,
              backgroundColor: theme.palette.warning.light,
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="body2">
              Editing message...
            </Typography>
            <IconButton size="small" onClick={handleCancelEditing}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            borderRadius: 4,
            p: 1,
            backgroundColor:
              theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          }}
        >
          <input
            accept="image/*"
            id="image-upload"
            type="file"
            hidden
            onChange={(e) => handleFileChange(e, 'image')}
            ref={fileInputRef}
          />
          <label htmlFor="image-upload">
            <Tooltip title="Send image">
              <IconButton
                component="span"
                sx={{ color: theme.palette.primary.main }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
          </label>

          <input
            accept="video/*"
            id="video-upload"
            type="file"
            hidden
            onChange={(e) => handleFileChange(e, 'video')}
          />
          <label htmlFor="video-upload">
            <Tooltip title="Send video">
              <IconButton
                component="span"
                sx={{ color: theme.palette.primary.main }}
              >
                <VideoCameraBack />
              </IconButton>
            </Tooltip>
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            ref={inputRef}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              outline: 'none',
              fontSize: '0.875rem',
            }}
          />


          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!newMessage.trim()}
            sx={{
              borderRadius: '50%',
              minWidth: 'auto',
              width: 40,
              height: 40,
              boxShadow: 'none',
            }}
          >
            <Send fontSize="small" />
          </Button>
        </Box>
      </Box>
    );
  });

  // Delete message dialog component
  const DeleteMessageDialog = ({ open, onClose, onConfirm }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Message</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this message? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          startIcon={<Delete />}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Leave group dialog component
  const LeaveGroupDialog = ({ open, onClose, onConfirm, isLastAdmin, groupName }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Leave Group?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {groupName ? (
            <>
              Are you sure you want to leave "{groupName}"?
              {isLastAdmin && (
                <Box sx={{ 
                  mt: 2,
                  p: 2,
                  bgcolor: 'warning.light',
                  borderRadius: 1
                }}>
                  <Typography variant="body2" color="warning.contrastText">
                    <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    You're the last admin. The group will become read-only if you leave.
                  </Typography>
                </Box>
              )}
            </>
          ) : 'Are you sure you want to leave this group?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          variant="contained"
          disabled={isLastAdmin}
          startIcon={<ExitToApp />}
        >
          Leave Group
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Main render
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Main chat area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Group header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/chats')}
              sx={{ color: theme.palette.text.primary }}
            >
              <ArrowBack />
            </IconButton>
            <Avatar
              src={group?.avatar || assets.noAvatar}
              sx={{ width: 50, height: 50 }}
              onError={(e) => {
                e.target.src = assets.noAvatar;
              }}
            />
            <Box>
              <Typography variant="h6">
                {group?.name || 'Loading group...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {group?.membersCount || 0} members • {group?.privacy || ''}
                {isAdmin && (
                  <Chip
                    label="Admin"
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                    icon={<AdminPanelSettings fontSize="small" />}
                  />
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={showMembers ? 'Hide members' : 'Show members'}>
              <IconButton
                onClick={() => setShowMembers(!showMembers)}
                sx={{ color: theme.palette.text.primary }}
              >
                <People />
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={handleMenuOpen}
              sx={{ color: theme.palette.text.primary }}
            >
              <MoreVert />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  minWidth: 200,
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    setEditDialogOpen(true);
                  }}
                >
                  <ListItemIcon>
                    <Edit fontSize="small" />
                  </ListItemIcon>
                  Edit Group
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  setLeaveDialogOpen(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <ExitToApp color="error" fontSize="small" />
                </ListItemIcon>
                Leave Group
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            backgroundImage:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9))'
                : 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))',
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
          }}
        >
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box
              textAlign="center"
              py={4}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography color="error">{error}</Typography>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : messages.length === 0 ? (
            <Box
              textAlign="center"
              py={4}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <img
                src={
                  theme.palette.mode === 'dark'
                    ? assets.emptyChatDark
                    : assets.emptyChatLight
                }
                alt="No messages"
                style={{ width: 200, opacity: 0.7 }}
                onError={(e) => {
                  e.target.src = assets.noImage;
                }}
              />
              <Typography
                variant="body1"
                sx={{ mt: 2, color: theme.palette.text.secondary }}
              >
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message) => (
                <MessageItem key={message._id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Message input */}
        <MessageInput />
      </Box>

      {/* Members sidebar */}
      {showMembers && (
        <Box
          sx={{
            width: isMobile ? '100%' : 300,
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            position: isMobile ? 'absolute' : 'relative',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor:
                theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            }}
          >
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Group Members
            </Typography>
            <IconButton
              onClick={() => setShowMembers(false)}
              sx={{ color: theme.palette.text.primary }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <GroupMembers
              groupId={groupId}
              isAdmin={isAdmin}
              currentUserId={user._id}
              onClose={() => setShowMembers(false)}
            />
          </Box>
        </Box>
      )}

      {/* Edit group dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mt: 2,
            }}
          >
            <input
              accept="image/*"
              id="group-avatar-upload"
              type="file"
              hidden
              onChange={handleAvatarChange}
            />
            <label htmlFor="group-avatar-upload">
              <Avatar
                src={
                  groupAvatar
                    ? URL.createObjectURL(groupAvatar)
                    : group?.avatar || assets.noAvatar
                }
                sx={{
                  width: 120,
                  height: 120,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                <AddPhotoAlternate sx={{ fontSize: 40 }} />
              </Avatar>
            </label>
            <Typography variant="caption" color="text.secondary">
              Click to change group avatar
            </Typography>

            <TextField
              fullWidth
              label="Group Name"
              value={groupName || ''}
              onChange={(e) => setGroupName(e.target.value)}
              variant="outlined"
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              value={groupDescription || ''}
              onChange={(e) => setGroupDescription(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateGroup}
            color="primary"
            variant="contained"
            startIcon={<Edit />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media preview dialog */}
      <Dialog
        open={!!mediaPreview}
        onClose={() => setMediaPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>Preview</Typography>
            <IconButton onClick={() => setMediaPreview(null)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {mediaType === 'image' ? (
            <img
              src={mediaPreview}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: theme.shape.borderRadius,
              }}
            />
          ) : (
            <video
              controls
              autoPlay
              style={{
                width: '100%',
                height: 'auto',
                '@media (max-width: 600px)': {
                  maxHeight: '200px',
                },
                borderRadius: theme.shape.borderRadius,
              }}
            >
              <source src={mediaPreview} type="video/mp4" />
            </video>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMediaPreview(null)}
            color="error"
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMedia}
            color="primary"
            variant="contained"
            disabled={isUploading}
            startIcon={<Send />}
          >
            {isUploading ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave group dialog */}
      <LeaveGroupDialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        onConfirm={handleLeaveGroup}
        isLastAdmin={isAdmin && members.filter(m => m.role === 'admin').length === 1}
        groupName={group?.name}
      />

      {/* Delete message dialog */}
      <DeleteMessageDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteMessage}
      />
    </Box>
  );
};

export default GroupChat;