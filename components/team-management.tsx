"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useToast } from "@/hooks/use-toast";
import { MockEmailService } from "@/lib/auth/mock-email-service";
import { MockInvitationStorage } from "@/lib/auth/mock-invitation-storage";
import {
  MockTeamStorage,
  type Team,
  type TeamMember,
} from "@/lib/auth/mock-team-storage";
import {
  AlertTriangle,
  Check,
  Copy,
  Crown,
  Edit,
  Mail,
  MoreHorizontal,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Enhanced Team Management Component
export function EnhancedTeamManagement() {
  const { user } = useMockAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] =
    useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);

  // Selected items for editing
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Form data
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });

  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "operator" as "admin" | "manager" | "operator",
    requiresExchangeAccount: false,
    suggestedExchange: "okx" as "okx" | "binance" | "bybit",
  });

  const [memberEditForm, setMemberEditForm] = useState({
    role: "operator" as "admin" | "manager" | "operator",
    permissions: [] as string[],
  });

  const teamStorage = MockTeamStorage.getInstance();
  const invitationStorage = MockInvitationStorage.getInstance();
  const emailService = MockEmailService.getInstance();

  // Load teams on mount
  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const loadTeams = () => {
    if (!user) return;

    setIsLoading(true);
    const allTeams = teamStorage.getAllTeams();
    const userTeams = allTeams.filter(
      (team) =>
        team.owner.id === user.id ||
        team.members.some((member) => member.id === user.id)
    );

    setTeams(userTeams);
    setIsLoading(false);

    if (userTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(userTeams[0]);
    }
  };

  // Team CRUD Operations
  const handleCreateTeam = () => {
    if (!user) return;

    try {
      const newTeam = teamStorage.addTeam(
        teamForm,
        user.id,
        user.full_name,
        user.email
      );

      setTeams((prev) => [...prev, newTeam]);
      setSelectedTeam(newTeam);
      setIsCreateTeamDialogOpen(false);
      setTeamForm({ name: "", description: "" });

      toast({
        title: "Team Created",
        description: `${newTeam.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam || !user) return;

    try {
      const updatedTeam = teamStorage.updateTeam(selectedTeam.id, teamForm);
      if (updatedTeam) {
        setTeams((prev) =>
          prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
        );
        setSelectedTeam(updatedTeam);
        setIsEditTeamDialogOpen(false);
        setTeamForm({ name: "", description: "" });

        toast({
          title: "Team Updated",
          description: "Team details have been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = () => {
    if (!teamToDelete || !user) return;

    try {
      const success = teamStorage.deleteTeam(teamToDelete.id);
      if (success) {
        setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
        if (selectedTeam?.id === teamToDelete.id) {
          setSelectedTeam(teams.find((t) => t.id !== teamToDelete.id) || null);
        }
        setIsDeleteConfirmDialogOpen(false);
        setTeamToDelete(null);

        toast({
          title: "Team Deleted",
          description: `${teamToDelete.name} has been deleted successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Member Management
  const handleInviteMember = async () => {
    if (!selectedTeam || !user) return;

    try {
      const permissions = getPermissionsByRole(inviteForm.role);

      const invitation = invitationStorage.createInvitation(
        selectedTeam.id,
        selectedTeam.name,
        user.id,
        user.full_name,
        inviteForm.email,
        inviteForm.role,
        permissions,
        inviteForm.requiresExchangeAccount,
        inviteForm.suggestedExchange
      );

      // If user doesn't require exchange account, create pending user
      if (!inviteForm.requiresExchangeAccount) {
        invitationStorage.createPendingUser(
          inviteForm.email,
          invitation.id,
          inviteForm.name,
          inviteForm.suggestedExchange
        );
      }

      const inviteLink = invitationStorage.generateInvitationLink(
        invitation.inviteCode
      );

      // Send email invitation
      await emailService.sendTeamInvitation(
        user.full_name,
        selectedTeam.name,
        inviteForm.email,
        inviteLink,
        inviteForm.role,
        inviteForm.requiresExchangeAccount
      );

      setIsInviteMemberDialogOpen(false);
      setInviteForm({
        email: "",
        name: "",
        role: "operator",
        requiresExchangeAccount: false,
        suggestedExchange: "okx",
      });

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteForm.email}. Link copied to clipboard.`,
        action: (
          <Button
            size="sm"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        ),
      });

      // Copy invite link to clipboard
      navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedTeam || !user) return;

    try {
      const success = teamStorage.removeMember(
        selectedTeam.id,
        memberId,
        user.id
      );
      if (success) {
        loadTeams(); // Reload to get updated data

        toast({
          title: "Member Removed",
          description: "Team member has been removed successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMemberRole = () => {
    if (!selectedTeam || !selectedMember || !user) return;

    try {
      const success = teamStorage.updateMemberRole(
        selectedTeam.id,
        selectedMember.id,
        memberEditForm.role,
        memberEditForm.permissions,
        user.id
      );

      if (success) {
        loadTeams(); // Reload to get updated data
        setIsEditMemberDialogOpen(false);
        setSelectedMember(null);

        toast({
          title: "Member Updated",
          description: "Member role and permissions have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleMemberStatus = (memberId: string) => {
    if (!selectedTeam || !user) return;

    try {
      const success = teamStorage.toggleMemberStatus(
        selectedTeam.id,
        memberId,
        user.id
      );
      if (success) {
        loadTeams(); // Reload to get updated data
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member status.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getPermissionsByRole = (role: string): string[] => {
    const rolePermissions = {
      admin: ["create_ads", "manage_orders", "view_analytics", "manage_team"],
      manager: ["create_ads", "manage_orders", "view_analytics"],
      operator: ["manage_orders", "handle_disputes"],
    };
    return rolePermissions[role as keyof typeof rolePermissions] || [];
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      owner: "bg-purple-50 text-purple-700 border-purple-200",
      admin: "bg-blue-50 text-blue-700 border-blue-200",
      manager: "bg-green-50 text-green-700 border-green-200",
      operator: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[role as keyof typeof colors] || colors.operator;
  };

  const isTeamOwner = (team: Team) => user && team.owner.id === user.id;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your P2P trading teams and members
          </p>
        </div>
        <Button
          onClick={() => setIsCreateTeamDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Teams Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first trading team to get started
          </p>
          <Button onClick={() => setIsCreateTeamDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Team
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card
              key={team.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTeam?.id === team.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedTeam(team)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {team.description}
                    </CardDescription>
                  </div>
                  {isTeamOwner(team) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamForm({
                              name: team.name,
                              description: team.description,
                            });
                            setIsEditTeamDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsInviteMemberDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamToDelete(team);
                            setIsDeleteConfirmDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      <span className="font-medium">{team.owner.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Members:</span>
                    <span className="font-medium">
                      {team.members.length + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Ads:</span>
                    <span className="font-medium">{team.activeAds}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Volume:</span>
                    <span className="font-medium">${team.totalVolume}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Details */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTeam.name}
                  {isTeamOwner(selectedTeam) && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </CardTitle>
                <CardDescription>{selectedTeam.description}</CardDescription>
              </div>
              {isTeamOwner(selectedTeam) && (
                <Button
                  onClick={() => setIsInviteMemberDialogOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-semibold">Team Members</h4>
              <div className="space-y-3">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTeam.owner.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedTeam.owner.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor("owner")}>Owner</Badge>
                    <Badge
                      className={
                        selectedTeam.owner.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }
                    >
                      {selectedTeam.owner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Members */}
                {selectedTeam.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                      <Badge
                        className={
                          member.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {isTeamOwner(selectedTeam) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (member.role !== "owner") {
                                  setSelectedMember(member);
                                  setMemberEditForm({
                                    role: member.role as
                                      | "admin"
                                      | "manager"
                                      | "operator",
                                    permissions: member.permissions,
                                  });
                                  setIsEditMemberDialogOpen(true);
                                }
                              }}
                              disabled={member.role === "owner"}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleMemberStatus(member.id)
                              }
                            >
                              {member.isActive ? (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {/* Create Team Dialog */}
      <Dialog
        open={isCreateTeamDialogOpen}
        onOpenChange={setIsCreateTeamDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new P2P trading team to manage your operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={teamForm.description}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your team's purpose and goals"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTeamDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={!teamForm.name.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog
        open={isEditTeamDialogOpen}
        onOpenChange={setIsEditTeamDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team's information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                value={teamForm.description}
                onChange={(e) =>
                  setTeamForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your team's purpose and goals"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTeamDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} disabled={!teamForm.name.trim()}>
              Update Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog
        open={isInviteMemberDialogOpen}
        onOpenChange={setIsInviteMemberDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="member@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-name">Full Name (Optional)</Label>
              <Input
                id="invite-name"
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Member's full name"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value: "admin" | "manager" | "operator") =>
                  setInviteForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    Admin - Full access except team management
                  </SelectItem>
                  <SelectItem value="manager">
                    Manager - Can create ads and manage orders
                  </SelectItem>
                  <SelectItem value="operator">
                    Operator - Can handle orders and disputes
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires-exchange"
                checked={inviteForm.requiresExchangeAccount}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    requiresExchangeAccount: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
                aria-label="Requires existing exchange account"
              />
              <Label htmlFor="requires-exchange">
                Requires existing exchange account
              </Label>
            </div>
            {!inviteForm.requiresExchangeAccount && (
              <div>
                <Label>Suggested Exchange</Label>
                <Select
                  value={inviteForm.suggestedExchange}
                  onValueChange={(value: "okx" | "binance" | "bybit") =>
                    setInviteForm((prev) => ({
                      ...prev,
                      suggestedExchange: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="okx">
                      OKX - Recommended for beginners
                    </SelectItem>
                    <SelectItem value="binance">
                      Binance - Most popular
                    </SelectItem>
                    <SelectItem value="bybit">
                      Bybit - Advanced features
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {inviteForm.requiresExchangeAccount
                  ? "Member must have an existing exchange account to join."
                  : "Member will be guided through exchange account setup process."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteForm.email.trim()}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={isEditMemberDialogOpen}
        onOpenChange={setIsEditMemberDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription>
              Update {selectedMember?.name}'s role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select
                value={memberEditForm.role}
                onValueChange={(value: "admin" | "manager" | "operator") => {
                  const permissions = getPermissionsByRole(value);
                  setMemberEditForm({ role: value, permissions });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {memberEditForm.permissions.map((permission) => (
                  <Badge
                    key={permission}
                    variant="secondary"
                    className="justify-center"
                  >
                    {permission.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMemberRole}>Update Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmDialogOpen}
        onOpenChange={setIsDeleteConfirmDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{teamToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              This will permanently delete the team and all associated data.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
