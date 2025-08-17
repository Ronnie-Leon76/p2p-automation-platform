# 👥 P2P Merchant User Type System

## Overview

The P2P Automation Platform now uses a refined user type system designed specifically for P2P trading operations. This system distinguishes between merchants who run P2P operations and team members who assist them.

## ✅ **User Types Implemented**

### **🔥 Merchant (`merchant`)**

- **Purpose**: Main P2P traders who own and operate trading businesses
- **Capabilities**:
  - Create and manage teams
  - Set up operations across multiple exchanges (OKX, Binance, Bybit)
  - Full control over team settings and permissions
  - Access to all platform features
- **Default Role**: `owner` (when creating/joining teams)
- **Registration**: Can create accounts directly

### **👤 Member (`member`)**

- **Purpose**: Team members invited by merchants to assist with operations
- **Capabilities**:
  - Join teams via invitation
  - Assigned specific roles with varying permissions
  - Execute tasks based on role permissions
  - Cannot create teams (only join existing ones)
- **Default Role**: `trader` (when joining teams)
- **Registration**: Can create accounts but primarily join via invitations

## 🎯 **Team Roles and Permissions**

### **Owner (Merchant Only)**

- **Full Control**: All platform features and team management
- **Permissions**: Complete access to trading, financial, team, and system operations
- **Exclusive**: Only merchants can be owners

### **Manager**

- **Senior Operations**: Daily operations management and team coordination
- **Permissions**: Trading operations, basic team management, analytics
- **Can**: Invite members, manage operations, view financials

### **Trader**

- **Active Trading**: Execute trades and manage customer interactions
- **Permissions**: Create/edit ads, manage orders, view analytics
- **Focus**: Front-line trading activities

### **Analyst**

- **Data & Strategy**: Analytics, reporting, and strategy development
- **Permissions**: View analytics, create reports, export data
- **Focus**: Performance analysis and strategic insights

### **Viewer**

- **Read-Only**: Monitor operations and view reports
- **Permissions**: View team data and basic analytics
- **Focus**: Oversight and monitoring

## 🔄 **System Changes Made**

### **1. Authentication System**

- ✅ Updated `RegisterData` interface: `accountType` → `userType`
- ✅ Changed from `'individual' | 'business' | 'enterprise'` → `'merchant' | 'member'`
- ✅ Enhanced signup form with user type selection

### **2. Database Schema**

- ✅ Added `user_type` field to users table
- ✅ Updated database types in `lib/supabase/types.ts`
- ✅ Migration script created: `scripts/add-user-types.sql`

### **3. User Interface**

- ✅ Updated signup form with clear user type selection
- ✅ Descriptive labels: "P2P Merchant" vs "Team Member"
- ✅ Visual radio button selection with explanations

### **4. Role System**

- ✅ Created comprehensive role definitions in `lib/auth/user-roles.ts`
- ✅ Permission-based system for fine-grained access control
- ✅ Role assignment validation

### **5. Components Updated**

- ✅ `secure-auth-form.tsx`: User type selection UI
- ✅ `trader-profile.tsx`: Updated user role types
- ✅ Various interfaces and type definitions

## 📋 **Implementation Details**

### **Registration Flow**

1. **User selects type**: Merchant or Team Member
2. **Account creation**: User type stored in database
3. **Default permissions**: Applied based on user type
4. **Team joining**: Different flows for merchants vs members

### **Permission Validation**

```typescript
// Example usage
import { hasPermission, ROLE_DEFINITIONS } from "@/lib/auth/user-roles";

// Check if user can create ads
const canCreateAds = hasPermission(userRole, "create_ads");

// Get all permissions for a role
const permissions = getRolePermissions("manager");

// Validate role assignment
const canAssign = canAssignRole(assignerRole, targetRole);
```

### **User Type Validation**

```typescript
// Ensure merchants can only be owners
const isValid = isValidUserTypeRole("merchant", "owner"); // true
const isInvalid = isValidUserTypeRole("member", "owner"); // false
```

## 🚀 **Migration Guide**

### **For Existing Users**

1. **Automatic Migration**: Existing users default to `merchant` type
2. **Manual Updates**: Adjust user types as needed via admin interface
3. **Role Reassignment**: Update team roles to match new system

### **Database Migration**

```sql
-- Run the migration script
\i scripts/add-user-types.sql
```

### **Code Updates**

- Replace `accountType` references with `userType`
- Update component imports to use new role system
- Validate permissions using new permission functions

## 🎨 **UI/UX Improvements**

### **Signup Form Enhancements**

- **Clear Selection**: Visual radio buttons with descriptions
- **User Guidance**: Explanatory text for each user type
- **Responsive Design**: Works on all device sizes

### **Role Management**

- **Permission Clarity**: Clear indication of what each role can do
- **Visual Hierarchy**: Easy-to-understand role progression
- **Contextual Help**: Tooltips and descriptions for complex permissions

## 🔮 **Future Enhancements**

### **Planned Features**

- **Role Templates**: Predefined role configurations for common setups
- **Custom Permissions**: Granular permission customization
- **Audit Logs**: Track role and permission changes
- **Bulk Operations**: Manage multiple team members at once

### **Advanced Features**

- **Time-based Roles**: Temporary role assignments
- **Geographic Restrictions**: Location-based permission limits
- **Integration Roles**: Specific roles for third-party integrations

## 🧪 **Testing**

### **Test Scenarios**

- ✅ Merchant registration and team creation
- ✅ Member registration and team joining
- ✅ Role assignment and permission validation
- ✅ User type conversion (if needed)
- ✅ Permission enforcement across features

### **Validation Points**

- User type selection during signup
- Role assignment restrictions
- Permission-based feature access
- Team ownership validation

This new user type system provides a solid foundation for P2P trading operations while maintaining flexibility for future enhancements!
