# Tips and Resources - Complete Documentation

## Overview

The **Tips and Resources** page is a comprehensive safety information hub in the Howard Safe app. It provides users with:
1. **Safety Tips** - Educational safety advice organized by category
2. **Emergency Contacts Directory** - A searchable, filterable directory of emergency contacts with tap-to-call/text functionality

---

## Page Structure

### Location
- **File**: `src/pages/Tips.tsx`
- **Route**: `/tips` (accessible via bottom navigation)

### Two Main Tabs

#### 1. **Tips Tab** (`activeTab === 'tips'`)
Displays hardcoded safety tips organized by categories:
- **Night Safety Tips** - Advice for staying safe at night
- **Personal Safety** - General personal safety guidelines
- **Personal Security** - Security best practices
- **Emergency Preparedness** - How to prepare for emergencies
- **Communication** - Staying connected and informed

Each tip displays:
- Title
- Category badge
- Icon
- Description text

#### 2. **Resources Tab** (`activeTab === 'resources'`)
Displays the emergency contacts directory with advanced features:
- **Search functionality** - Search contacts by name, description, or phone number
- **Category filters** - Filter by Emergency Contacts, Support Services, Safety Resources
- **Favorites system** - Star/unstar contacts for quick access
- **Offline caching** - Works without internet connection
- **Tap-to-call/text** - Direct calling and texting from the app
- **Sync status** - Shows last sync time and network status

---

## Database Schema

### Table: `emergency_contacts`

Located in: `supabase/migrations/20250101000000_add_emergency_contacts_schema.sql`

#### Schema Structure

```sql
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                    -- Contact name (e.g., "Campus Security")
  contact TEXT NOT NULL,                   -- Phone number or contact info
  description TEXT NOT NULL,               -- Brief description
  category TEXT NOT NULL CHECK (category IN (
    'emergency-contacts', 
    'support-services', 
    'safety-resources'
  )),
  priority INT NOT NULL DEFAULT 0,          -- 0=normal, 1=high, 2=critical
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global, UUID = user-specific
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Indexes
- `idx_emergency_contacts_category` - Fast category filtering
- `idx_emergency_contacts_priority` - Fast priority sorting
- `idx_emergency_contacts_active` - Fast active status filtering
- `idx_emergency_contacts_user_id` - Fast user-specific queries

#### Row Level Security (RLS) Policies

**For Reading:**
- **Policy**: `emergency_contacts_select_public_and_own`
- **Access**: Anonymous and authenticated users
- **Rule**: Users can view:
  - Global contacts (`user_id IS NULL`)
  - Their own personal contacts (`user_id = auth.uid()`)
  - Only active contacts (`is_active = true`)

**For Creating:**
- **Policy**: `emergency_contacts_insert_own`
- **Access**: Authenticated users only
- **Rule**: Users can only insert contacts with their own `user_id`

**For Updating:**
- **Policy**: `emergency_contacts_update_own`
- **Access**: Authenticated users only
- **Rule**: Users can only update their own contacts

**For Deleting:**
- **Policy**: `emergency_contacts_delete_own`
- **Access**: Authenticated users only
- **Rule**: Users can only delete their own contacts

**For Global Contacts:**
- **Policy**: `emergency_contacts_modify_global`
- **Status**: Currently disabled (returns `false`)
- **Future**: Will be enabled when admin role system is implemented

---

## Contact Types

### 1. Global Contacts (Default/Emergency Contacts)

**Definition**: Contacts available to all users, managed by administrators.

**Characteristics:**
- `user_id IS NULL` in database
- Examples: Campus Security, 911, Howard University Hospital
- Displayed under category sections: "Emergency Contacts", "Support Services", "Safety Resources"
- Cannot be edited or deleted by regular users
- Seeded in initial migration with default campus contacts

**Default Global Contacts:**
- Campus Security: `(202) 806-HELP (4357)`
- Metropolitan Police: `911`
- Howard University Hospital: `(202) 865-6100`
- Student Health Center: `(202) 806-7540`
- Counseling Services: `(202) 806-6870`
- Title IX Office: `(202) 806-2550`
- Dean of Students: `(202) 806-2755`
- Campus Ministry: `(202) 806-7280`
- Safety Escort Service: `(202) 806-4357`
- Blue Light Phones: `Campus-wide`
- LiveSafe App: `Download from app store`
- Safety Training: `(202) 806-1919`

### 2. User-Specific Contacts (Your Saved)

**Definition**: Personal contacts added by individual users.

**Characteristics:**
- `user_id = current_user_id` in database
- Examples: "Mom", "Dad", "Best Friend", "BF"
- Displayed in a separate "Your Saved" section at the top
- Can be added, edited, and deleted by the user who created them
- Managed from Profile Settings page (not from Tips page)

**Management:**
- **Add**: Profile Settings → Emergency Contacts → "Add New Contact"
- **Edit**: Profile Settings → Emergency Contacts → Click edit icon
- **Delete**: Profile Settings → Emergency Contacts → Click delete icon

---

## Data Flow

### 1. Data Fetching (`useEmergencyContacts` Hook)

**Location**: `src/hooks/useEmergencyContacts.tsx`

**Process:**

1. **Initial Load:**
   - Checks `localStorage` for cached data
   - If cached data exists and is recent, uses it immediately
   - Fetches fresh data from Supabase in background

2. **Database Query:**
   ```typescript
   // If user is logged in:
   query = supabase
     .from('emergency_contacts')
     .select('*')
     .eq('is_active', true)
     .or(`user_id.is.null,user_id.eq.${userId}`)
     .order('priority', { ascending: false })
     .order('title', { ascending: true });
   
   // If user is not logged in:
   query = supabase
     .from('emergency_contacts')
     .select('*')
     .eq('is_active', true)
     .is('user_id', null);  // Only global contacts
   ```

3. **Fallback Mechanism:**
   - If database table doesn't exist → Uses `FALLBACK_CONTACTS` (hardcoded data)
   - If network error and no cache → Uses `FALLBACK_CONTACTS`
   - If network error but cache exists → Uses cached data
   - Ensures app always works, even without database

4. **Caching:**
   - Saves fetched data to `localStorage` with timestamp
   - Cache key: `emergency-contacts-cache`
   - Timestamp key: `emergency-contacts-last-sync`
   - Used for offline access

### 2. Data Processing in Tips Page

**Location**: `src/pages/Tips.tsx`

**Process:**

1. **Separation:**
   ```typescript
   // Split contacts into global and personal
   contacts.forEach(contact => {
     if (isUserContact(contact)) {
       personalContacts.push(contact);
     } else {
       globalContacts.push(contact);
     }
   });
   ```

2. **Grouping:**
   - Global contacts grouped by `category` (emergency-contacts, support-services, safety-resources)
   - Personal contacts placed in single "Your Saved" section

3. **Display Order:**
   - "Your Saved" section appears first (if user has personal contacts)
   - Then global contact categories (sorted by priority, then alphabetically)

---

## Features

### 1. Search Functionality

**Implementation:**
- Real-time search as user types
- Searches across:
  - Contact title (name)
  - Contact description
  - Phone number/contact info

**Code:**
```typescript
const filteredResources = useMemo(() => {
  let filtered = resources;
  
  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.contact.toLowerCase().includes(query)
      )
    })).filter(category => category.items.length > 0);
  }
  
  // ... additional filters
}, [resources, searchQuery, selectedCategory, showFavoritesOnly, favorites]);
```

### 2. Category Filtering

**Categories:**
- **All** - Shows all contacts
- **Emergency Contacts** - Critical emergency numbers
- **Support Services** - Campus support resources
- **Safety Resources** - Safety tools and information

**Implementation:**
- Filter buttons at top of Resources tab
- "Clear all filters" button when filters are active
- Results count display

### 3. Favorites System

**Functionality:**
- Star/unstar contacts for quick access
- Favorites stored in `localStorage` (key: `emergency-contacts-favorites`)
- "Show Favorites Only" toggle button
- Favorites persist across sessions

**Storage:**
```typescript
// Save to localStorage
localStorage.setItem('emergency-contacts-favorites', JSON.stringify([...favorites]));

// Load from localStorage
const savedFavorites = localStorage.getItem('emergency-contacts-favorites');
```

### 4. Offline Caching

**Features:**
- Automatic caching of fetched contacts
- Works without internet connection
- Shows offline indicator banner
- Displays last sync time
- Manual sync button

**Implementation:**
- Network status detection via `navigator.onLine`
- Listens to `online`/`offline` events
- Cached data in `localStorage`
- Fallback to cached data when offline

### 5. Tap-to-Call/Text

**Phone Number Detection:**

The system uses an intelligent `isPhoneNumber()` function to determine which contacts should show call/text buttons:

**Rules:**
1. **Special Emergency Numbers**: Always show buttons (911, 112, 999, 000)
2. **Numbers with Letters**: Extracts digits from formats like "(202) 806-HELP (4357)"
3. **Standard Phone Numbers**: Must have at least 7 digits
4. **Exclusions**: Automatically excludes:
   - Websites (http, https, www., .com, .org, .edu, .gov)
   - Email addresses (@)
   - Non-phone text (download, campus-wide)

**Implementation:**
```typescript
const isPhoneNumber = (contact: string): boolean => {
  // Special emergency numbers
  const emergencyNumbers = ['911', '112', '999', '000'];
  if (emergencyNumbers.includes(trimmedContact)) {
    return true;
  }
  
  // Extract digits and validate
  const digitsOnly = trimmedContact.replace(/\D/g, '');
  if (digitsOnly.length < 7) return false;
  
  // Exclude non-phone patterns
  // ... exclusion logic
  
  return true;
};
```

**Call/Text Actions:**
- **Mobile**: Opens native phone dialer or SMS app
- **Desktop**: Copies phone number to clipboard
- Toast notifications for user feedback

### 6. Sync Status

**Display:**
- Network status icon (WiFi/WiFiOff)
- Last sync timestamp
- Manual sync button
- Offline alert banner

**Sync Process:**
- Fetches fresh data from Supabase
- Updates cache and timestamp
- Shows success/error toast

---

## Profile Settings Integration

### Emergency Contacts Management

**Location**: `src/pages/Profile.tsx` and `src/components/EmergencyContactsDialog.tsx`

**Features:**
- View all personal emergency contacts
- Add new personal contacts
- Edit existing personal contacts
- Delete personal contacts
- Tap-to-call/text for personal contacts

**Form Fields:**
- **Name** (required) - e.g., "Mom", "Dad", "Best Friend"
- **Phone Number** (required) - e.g., "(202) 555-1234"
- **Description** (optional) - Additional context
- **Category** (required) - emergency-contacts, support-services, safety-resources
- **Priority** (default: 0) - 0=normal, 1=high, 2=critical

**Database Operations:**
- `addUserContact()` - Inserts new contact with `user_id = current_user_id`
- `updateUserContact()` - Updates existing contact (only if `user_id` matches)
- `deleteUserContact()` - Deletes contact (only if `user_id` matches)

---

## File Structure

```
src/
├── pages/
│   └── Tips.tsx                    # Main Tips and Resources page
├── hooks/
│   └── useEmergencyContacts.tsx   # Data fetching and management hook
├── components/
│   └── EmergencyContactsDialog.tsx # Personal contacts management dialog
└── integrations/
    └── supabase/
        └── types.ts                # TypeScript types for database

supabase/
└── migrations/
    ├── 20250101000000_add_emergency_contacts_schema.sql      # Base schema
    └── 20250117000000_add_user_emergency_contacts.sql       # User-specific contacts
```

---

## Key Functions

### `useEmergencyContacts(userId?: string | null)`

**Returns:**
- `contacts` - Array of all contacts (global + user-specific)
- `groupedContacts` - Contacts grouped by category
- `loading` - Loading state
- `error` - Error message (if any)
- `lastSyncTime` - Timestamp of last successful sync
- `refetch()` - Manual refresh function
- `isOnline` - Network status
- `addUserContact()` - Add personal contact
- `updateUserContact()` - Update personal contact
- `deleteUserContact()` - Delete personal contact
- `isUserContact()` - Check if contact belongs to user

### `isPhoneNumber(contact: string): boolean`

Determines if a contact string should display call/text buttons.

### `extractPhoneNumber(contact: string): string`

Extracts clean phone number from contact string for dialing.

### `handleCall(contact: string, title: string)`

Opens phone dialer (mobile) or copies to clipboard (desktop).

### `handleText(contact: string, title: string)`

Opens SMS app (mobile) or copies to clipboard (desktop).

---

## Error Handling

### Database Errors

1. **Table doesn't exist** (`PGRST116`):
   - Uses `FALLBACK_CONTACTS` (hardcoded data)
   - App continues to work normally

2. **Network errors**:
   - Uses cached data if available
   - Shows error toast to user
   - Displays offline indicator

3. **RLS policy violations**:
   - User cannot see/modify contacts they don't own
   - Errors logged to console
   - User-friendly error messages

### Fallback Data

Located in: `src/hooks/useEmergencyContacts.tsx`

Contains 12 default emergency contacts that are always available, even if database is unavailable.

---

## Performance Optimizations

1. **localStorage Caching**: Instant load from cache, background refresh
2. **useMemo**: Expensive filtering operations memoized
3. **Indexed Queries**: Database indexes for fast category/priority/user filtering
4. **Lazy Loading**: Contacts loaded only when Resources tab is active
5. **Debounced Search**: Search updates optimized (if implemented)

---

## Future Enhancements

1. **Admin Panel**: Interface for managing global contacts
2. **Contact Import**: Import contacts from phone contacts
3. **Emergency Shortcuts**: Quick access buttons for critical contacts
4. **Contact Sharing**: Share contacts with other users
5. **Analytics**: Track which contacts are used most frequently
6. **Custom Categories**: Allow users to create custom categories
7. **Contact Photos**: Add profile pictures to personal contacts
8. **Scheduled Sync**: Automatic background sync at intervals

---

## Testing Checklist

- [ ] Search functionality works across all fields
- [ ] Category filters correctly filter contacts
- [ ] Favorites persist after page refresh
- [ ] Offline mode works with cached data
- [ ] Call/text buttons appear only for valid phone numbers
- [ ] Personal contacts appear in "Your Saved" section
- [ ] Global contacts appear in category sections
- [ ] User can add/edit/delete personal contacts
- [ ] User cannot modify global contacts
- [ ] RLS policies prevent unauthorized access
- [ ] Fallback data loads when database unavailable
- [ ] Sync status updates correctly
- [ ] Network status detection works

---

## Troubleshooting

### Contacts not loading
1. Check Supabase connection
2. Verify migrations are applied
3. Check browser console for errors
4. Verify RLS policies are correct

### Call/text buttons not appearing
1. Check `isPhoneNumber()` function logic
2. Verify contact string format
3. Check for exclusion patterns

### Personal contacts not showing
1. Verify user is logged in
2. Check `user_id` in database
3. Verify RLS policies allow user to see own contacts

### Offline mode not working
1. Check `localStorage` for cached data
2. Verify cache keys are correct
3. Check network status detection

---

## Summary

The Tips and Resources page is a comprehensive safety hub that combines:
- **Educational content** (Safety Tips)
- **Actionable resources** (Emergency Contacts Directory)
- **Personal customization** (User-saved contacts)
- **Offline capability** (Caching system)
- **Modern UX** (Search, filter, favorites)

The database architecture supports both global (admin-managed) and user-specific contacts, with robust security via RLS policies. The system gracefully handles errors and network issues through fallback mechanisms and caching.

