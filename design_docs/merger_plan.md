# Arcane Forge Website & Games Platform Merger Plan (Simplified)

## Overview
Simple merger strategy: Keep the website repo as primary, add our games platform under `/games` route, avoid path conflicts by moving Flutter games.

## Strategy

### Primary Repository: `arcane_forge_website`
- Keep all existing website functionality intact
- Add games platform functionality under `/games` route
- No UI unification required initially

### Key Changes

#### 1. Path Structure
```
arcaneforge.ai/                    # Homepage (existing website)
├── /contact                       # Contact page (existing)
├── /games/                        # Our games platform (new)
│   ├── /games/[slug]             # Individual game pages
│   └── /games/admin              # Admin interface
└── /flutter-games/[game]/        # Flutter games (moved from /games/)
```

#### 2. Asset Reorganization
- Move `public/games/` → `public/flutter-games/`
- This prevents path conflict with our `/games` route

#### 3. Remove Auto-Redirect
- Remove the redirect from `/` to `/games` in our current repo
- Let website homepage stay as the main landing page

## Migration Steps I Will Execute

### Phase 1: Prepare Website Repo
1. **Navigate to website repo**
2. **Move Flutter games**: `public/games/` → `public/flutter-games/`
3. **Update any references** to the old Flutter games path
4. **Install additional dependencies** needed for games platform
5. **Set up environment variables** for Supabase

### Phase 2: Copy Games Platform
1. **Copy all games components** from current repo to `components/games/`
2. **Copy API routes** to `app/api/games/` and `app/api/admin/`
3. **Copy games pages** to `app/games/` directory
4. **Copy database types and utilities** to `lib/` and `types/`
5. **Copy Supabase migrations** to `supabase/migrations/`

### Phase 3: Update Configurations
1. **Merge package.json dependencies**
2. **Update next.config.js** if needed
3. **Ensure Tailwind config** includes all necessary classes
4. **Set up environment variables**

### Phase 4: Fix Imports and Paths
1. **Update all import paths** in copied components
2. **Fix any hardcoded paths** that reference old structure
3. **Update Flutter game references** to use `/flutter-games/` path
4. **Remove redirect logic** from games platform

### Phase 5: Test Integration
1. **Test website homepage** - should work unchanged
2. **Test `/games` route** - should show games library
3. **Test individual game pages** - should work with comments/stats
4. **Test admin interface** - should work at `/games/admin`
5. **Test Flutter games** - should work at new `/flutter-games/` path

## File Operations I Will Perform

### Copy from `arcane_forge_games` to `arcane_forge_website`:
```
src/components/ → components/games/
src/app/games/ → app/games/
src/app/admin/ → app/admin/
src/app/api/ → app/api/
src/lib/ → lib/
src/types/ → types/
supabase/ → supabase/
```

### Modify in `arcane_forge_website`:
```
public/games/ → public/flutter-games/
package.json (add dependencies)
.env (add Supabase vars)
```

### Update References:
- Any links to Flutter games: `/games/` → `/flutter-games/`
- Import paths in all copied files
- Remove redirect logic from root page

## Dependencies to Add
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "clsx": "^2.1.1", 
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0"
}
```

## Environment Variables to Add
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_TOKEN=your_admin_token
```

## Expected Result
- `arcaneforge.ai/` - Marketing website (unchanged)
- `arcaneforge.ai/games/` - Games library with full functionality
- `arcaneforge.ai/games/[slug]` - Individual games with comments/stats
- `arcaneforge.ai/games/admin` - Admin interface
- `arcaneforge.ai/flutter-games/shape-rogue/` - Flutter games (moved)

## Timeline: 2-3 hours
1. **30 min**: Prepare website repo and move Flutter games
2. **60 min**: Copy all games platform files
3. **30 min**: Update configurations and dependencies  
4. **30 min**: Fix imports and paths
5. **30 min**: Test everything works

## Approval Needed
Once you approve this plan, I will:
1. Execute all steps in sequence
2. Test each phase before moving to the next
3. Report any issues encountered
4. Provide final verification that everything works

Ready to proceed when you give the go-ahead! 