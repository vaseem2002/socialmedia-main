import { useState, useEffect, useContext, useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  TextField,
  CircularProgress,
  Badge,
  Tooltip,
  IconButton,
} from '@mui/material';
import axiosInstance from '../utils/axiosInstance';
import { UserContext } from '../context/userContext';
import { toast } from 'react-toastify';
import CreateGroupModal from './CreateGroupModal';
import { CheckCircle, GroupAdd, Search } from '@mui/icons-material';

const GroupList = () => {
  const { user } = useContext(UserContext);
  const [allGroups, setAllGroups] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [myCreatedGroups, setMyCreatedGroups] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGroups(),
        fetchMyGroups(),
        fetchMyCreatedGroups(),
      ]);
    } catch (error) {
      toast.error('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/groups');
      // Validate response structure
      const validatedGroups = Array.isArray(res.data)
        ? res.data.map((group) => ({
            ...group,
            creator: group.creator || { _id: null, username: 'Unknown' },
            privacy: group.privacy || 'public',
            membersCount: group.membersCount || 0,
          }))
        : [];
      setAllGroups(validatedGroups);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch groups');
      setAllGroups([]);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const res = await axiosInstance.get("/api/groups");
      // Filter groups where user is a member
      const myGroups = res.data.filter(group => 
        group.members?.some(m => m.user === user?._id)
      );
      setMyGroups(myGroups);
    } catch (err) {
      setMyGroups([]);
    }
  };

  const fetchMyCreatedGroups = async () => {
    try {
      const res = await axiosInstance.get("/api/groups");
      // Filter groups created by current user
      const createdGroups = res.data.filter(group => 
        group.creator === user?._id
      );
      setMyCreatedGroups(createdGroups);
    } catch (err) {
      setMyCreatedGroups([]);
    }
  };

  // Filter groups user hasn't joined yet and exclude private groups created by the user
  // Updated unjoinedGroups filter
  const unjoinedGroups = useMemo(() => {
    return allGroups.filter(group => {
      // Skip if group data is invalid
      if (!group || !group.creator) return false;
      
      const isMember = myGroups.some(g => g._id === group._id);
      const isCreator = group.creator._id === user?._id;
      
      // Show group if:
      // 1. User is not a member AND
      // 2. Either:
      //    a. Group is public, OR
      //    b. User is the creator (regardless of privacy)
      return !isMember && (group.privacy === "public" || isCreator);
    });
  }, [allGroups, myGroups, user]);

  // Updated filteredGroups
  const filteredGroups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return unjoinedGroups.filter((group) => {
      // Skip if group data is incomplete
      if (!group || !group.creator || !group.name) return false;

      // Hide private groups created by current user from search results
      if (group.creator._id === user?._id && group.privacy === 'private') {
        return false;
      }

      return (
        group.name.toLowerCase().includes(term) ||
        (group.description && group.description.toLowerCase().includes(term)) ||
        group.creator.username.toLowerCase().includes(term)
      );
    });
  }, [unjoinedGroups, searchTerm, user]);

  const handleJoinGroup = async (groupId, privacy) => {
    setJoiningGroupId(groupId);
    try {
      let endpoint = `/api/groups/${groupId}/join`;
      let method = 'POST';
      
      if (privacy === "private") {
        endpoint = `/api/groups/${groupId}/join`; // Same endpoint but different handling in backend
        method = 'POST';
      }
  
      const response = await axiosInstance({
        method,
        url: endpoint,
        data: { privacy } // Send privacy type in body
      });
  
      if (response.status === 200) {
        toast.success(
          privacy === "private" 
            ? "Join request sent to admin" 
            : "Joined group successfully"
        );
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join group");
    } finally {
      setJoiningGroupId(null);
    }
  };

  // Updated getGroupStatus with null check
  const getGroupStatus = (groupId) => {
    if (!groupId) return 'not_joined';
    if (myGroups.some((g) => g._id === groupId)) return 'joined';
    if (myCreatedGroups.some((g) => g._id === groupId)) return 'created';
    return 'not_joined';
  };

  const renderGroupPrivacy = (privacy) => {
    return (
      <Tooltip
        title={
          privacy === 'private'
            ? 'Private group - Requires approval'
            : 'Public group - Anyone can join'
        }
      >
        <Chip
          label={privacy}
          size="small"
          color={privacy === 'private' ? 'warning' : 'success'}
          sx={{ textTransform: 'capitalize' }}
        />
      </Tooltip>
    );
  };

  const renderJoinButton = (group) => {
    if (!group) return null;
  
    const status = getGroupStatus(group._id);
    
    if (status === "joined") {
      return <Button variant="contained" disabled>Joined</Button>;
    }
  
    if (status === "created") {
      return <Button variant="outlined">Manage</Button>;
    }
  
    return (
      <Button 
        variant={group.privacy === "private" ? "outlined" : "contained"}
        onClick={() => handleJoinGroup(group._id, group.privacy)}
        color={group.privacy === "private" ? "secondary" : "primary"}
      >
        {group.privacy === "private" ? "Request to Join" : "Join Group"}
      </Button>
    );
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, margin: '0 auto' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Groups
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            onClick={() => setCreateModalOpen(true)}
            sx={{ minWidth: 150 }}
          >
            Create Group
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* My Groups Section */}
          {(myGroups.length > 0 || myCreatedGroups.length > 0) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                My Groups
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: 2,
                }}
              >
                {[...myGroups, ...myCreatedGroups].map((group) => (
                  <Card key={group._id} elevation={2}>
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        bgcolor: 'action.selected',
                        position: 'relative',
                      }}
                    >
                      {group.creator._id === user?._id && (
                        <Chip
                          label="Creator"
                          color="primary"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        />
                      )}
                      <Avatar
                        src={group.avatar}
                        sx={{ width: 70, height: 70 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {group.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {group.description || 'No description'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {renderGroupPrivacy(group.privacy)}
                          <Chip
                            label={`${group.membersCount} members`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => {
                          /* Navigate to group chat */
                        }}
                        sx={{ minWidth: 100 }}
                      >
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Available Groups Section */}
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
              {myGroups.length > 0
                ? 'Discover More Groups'
                : 'Available Groups'}
            </Typography>

            {filteredGroups.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: 2,
                }}
              >
                {filteredGroups.map((group) => (
                  <Card key={group._id}>
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        position: 'relative',
                      }}
                    >
                      <Avatar
                        src={group.avatar}
                        sx={{ width: 70, height: 70 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {group.name || 'Unnamed Group'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Created by {group.creator?.username || 'Unknown user'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                        {group.creator._id === user?._id && (
        <Chip 
          label="Your Group" 
          color="primary" 
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10 }}
        />
      )}
                          {renderGroupPrivacy(group.privacy)}
                          <Chip 
          label={group.privacy === "private" ? "Private - Approval Required" : "Public"} 
          color={group.privacy === "private" ? "secondary" : "primary"}
          sx={{ mb: 1, mt: 1 }}
        />
                        </Box>
                      </Box>
                      {renderJoinButton(group)}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" p={4}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {searchTerm
                    ? 'No matching groups found'
                    : 'No groups available to join'}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="outlined"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Create your first group
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </>
      )}

      <CreateGroupModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        refreshGroups={fetchAllData}
      />
    </Box>
  );
};

export default GroupList;
