import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useContext } from 'react';
import { UserContext } from '../context/userContext';
import { 
  Avatar, 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  CircularProgress,
  Chip,
  ListItemIcon,
  Divider
} from "@mui/material";
import { 
  MoreVert, 
  AdminPanelSettings,
  PersonRemove,
  Close,
  PersonAdd,
  PersonOff
} from "@mui/icons-material";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const GroupMembers = ({ groupId, isAdmin, currentUserId, onClose, groupPrivacy }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/groups/${groupId}/members`);
        
        // Transform data to match expected frontend structure
        const membersData = Array.isArray(res.data) 
          ? res.data.map(member => ({
              ...member,
              _id: member.user?._id || member._id, // Ensure consistent ID
              role: member.role || 'member',
              status: member.status || 'joined'
            }))
          : [];
          
        setMembers(membersData);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        setError(error.response?.data?.message || "Failed to load members");
        toast.error(error.response?.data?.message || "Failed to load group members");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleMemberAction = async (action) => {
    if (!selectedMember) return;
  
    try {
      let response;
      const memberId = selectedMember.user?._id || selectedMember._id;
      
      switch(action) {
        case 'remove':
          response = await axiosInstance.delete(
            `/api/groups/${groupId}/members/${memberId}`
          );
          break;
          
        case 'makeAdmin':
          response = await axiosInstance.put(
            `/api/groups/${groupId}/members/${memberId}/role`,
            { role: "admin" }
          );
          break;
          
        case 'demote':
          response = await axiosInstance.put(
            `/api/groups/${groupId}/members/${memberId}/role`,
            { role: "member" }
          );
          break;
          
        case 'approve':
          response = await axiosInstance.put(
            `/api/groups/${groupId}/requests/${memberId}`,
            { action: "approve" }
          );
          break;
          
        case 'reject':
          response = await axiosInstance.put(
            `/api/groups/${groupId}/requests/${memberId}`,
            { action: "reject" }
          );
          break;
          
        default:
          throw new Error("Invalid action");
      }

      if (response.status === 200) {
        // Refresh members after successful action
        const freshMembers = await fetchGroupMembers();
        setMembers(freshMembers);
        
        toast.success(response.data.message || "Action completed successfully");
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action}`);
    } finally {
      handleMenuClose();
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${groupId}/members`);
      return res.data;
    } catch (err) {
      console.error('Member fetch error:', err);
      toast.error("Couldn't refresh members");
      return members;
    }
  };

  const renderMemberStatus = (member) => {
    if (member.status === 'pending') {
      return <Chip label="Pending" size="small" color="warning" sx={{ mr: 1 }} />;
    }
    if (member.role === "admin") {
      return (
        <Chip 
          label="Admin" 
          size="small" 
          color="primary" 
          icon={<AdminPanelSettings fontSize="small" />}
          sx={{ mr: 1 }}
        />
      );
    }
    if (member.user?._id === currentUserId) {
      return <Chip label="You" size="small" variant="outlined" />;
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Separate members by status
  const activeMembers = members.filter(m => m.status === 'joined');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <Box sx={{ p: 2, maxWidth: 500, margin: '0 auto' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">Group Members ({activeMembers.length})</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      
      {/* Active Members List */}
      <List dense>
        {activeMembers.length > 0 ? (
          activeMembers.map((member) => (
            <ListItem key={member._id} sx={{ py: 1 }}>
              <ListItemAvatar>
                <Avatar 
                  src={member.user?.profilePicture || assets.noAvatar} 
                  alt={member.user?.username}
                />
              </ListItemAvatar>
              <ListItemText
                primary={member.user?.username || "Unknown User"}
                secondary={renderMemberStatus(member)}
              />
              {isAdmin && member.user?._id !== currentUserId && (
                <>
                  <IconButton 
                    onClick={(e) => handleMenuOpen(e, member)}
                    aria-label="member actions"
                  >
                    <MoreVert />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl && selectedMember?._id === member._id)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => handleMemberAction('remove')}>
                      <ListItemIcon>
                        <PersonRemove fontSize="small" />
                      </ListItemIcon>
                      Remove Member
                    </MenuItem>
                    {member.role !== "admin" ? (
                      <MenuItem onClick={() => handleMemberAction('makeAdmin')}>
                        <ListItemIcon>
                          <AdminPanelSettings fontSize="small" />
                        </ListItemIcon>
                        Make Admin
                      </MenuItem>
                    ) : (
                      <MenuItem onClick={() => handleMemberAction('demote')}>
                        <ListItemIcon>
                          <AdminPanelSettings fontSize="small" />
                        </ListItemIcon>
                        Demote to Member
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            No active members found
          </Typography>
        )}
      </List>

      {/* Pending Requests Section (only for private groups) */}
      {groupPrivacy === 'private' && pendingMembers.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Pending Requests ({pendingMembers.length})
          </Typography>
          <List dense>
            {pendingMembers.map((member) => (
              <ListItem key={member._id} sx={{ py: 1 }}>
                <ListItemAvatar>
                  <Avatar 
                    src={member.user?.profilePicture || assets.noAvatar} 
                    alt={member.user?.username}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={member.user?.username || "Unknown User"}
                  secondary={renderMemberStatus(member)}
                />
                {isAdmin && (
                  <>
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, member)}
                      aria-label="pending member actions"
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl && selectedMember?._id === member._id)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem onClick={() => handleMemberAction('approve')}>
                        <ListItemIcon>
                          <PersonAdd fontSize="small" />
                        </ListItemIcon>
                        Approve Request
                      </MenuItem>
                      <MenuItem onClick={() => handleMemberAction('reject')}>
                        <ListItemIcon>
                          <PersonOff fontSize="small" />
                        </ListItemIcon>
                        Reject Request
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default GroupMembers;