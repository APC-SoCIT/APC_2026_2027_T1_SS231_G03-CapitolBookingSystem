# Capitol Booking System
Group: Vector Four (SS231)


Members:
- Christian Luis Esguerra
- Moises James Q. Sy
- Suzanne Marie Rosco
- Maria Sophea Balidio

### About the Project
A continuation from our PROJMAN class to our current one (SOFTDEV). **Capitol Booking System** is a web-based platform that modernizes Capitol Restaurant's reservation and inquiry management. It consolidates catering inquiries, function room reservations, and food delivery orders into a single, unified interface with real-time availability and automated conflict detection.

### Commit Reference Table

| Type       | Description                                                                 | Example Subject                                           |
| :--------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------- |
| `feat`     | A **new feature** for the user.                                             | `feat(auth): Add user registration flow`                  |
| `fix`      | A **bug fix**.                                                              | `fix(modal): Correct z-index issue`                       |
| `docs`     | **Documentation only changes**.                                             | `docs: Update README with setup guide`                    |
| `style`    | Changes that do not affect the meaning of the code (whitespace, formatting).| `style: Apply Prettier formatting`                        |
| `refactor` | A code change that neither fixes a bug nor adds a feature (e.g., renaming). | `refactor(utils): Extract validation logic`               |
| `test`     | Adding missing **tests** or correcting existing tests.                      | `test: Add unit tests for API client`                     |
| `chore`    | Other changes that don't modify src or test files (e.g., dependency updates).| `chore: Update Node.js version in CI`                     |
| `build`    | Changes that affect the **build system** or external dependencies.          | `build: Configure Webpack for production`                 |
| `ci`       | Changes to **CI configuration** files and scripts.                          | `ci: Add E2E tests to workflow`                           |
| `perf`     | A code change that **improves performance**.                                | `perf: Optimize database query`                           |
| `revert`   | **Reverts** a previous commit.                                              | `revert: feat: Add experimental feature X`                |
| `security` | Fixes related to **vulnerabilities** or security patches.                   | `security(auth): Fix JWT token leak`                      |
| `hotfix`   | An **urgent fix** applied to production (alternative to `fix`).             | `hotfix(api): Patch crash in payment gateway`             |
| `merge`    | A commit created by **merging branches**.                                   | `merge: branch 'feature/login' into 'main'`               |

### Authentication Setup

Authentication uses Supabase Auth with passwordless magic links and Google OAuth.

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. In Supabase Dashboard, enable Email authentication and configure the Site URL plus `http://localhost:5173/dashboard` as an additional redirect URL.
3. In Google Cloud, create a Web OAuth client. Add `http://localhost:5173` as an authorized JavaScript origin and add the Supabase Auth callback URL shown in the Google provider settings as an authorized redirect URI.
4. Enable Google under Supabase Dashboard > Authentication > Providers and save the Google client ID and client secret there. Never place the client secret or service-role key in frontend code.
5. Apply the migration in `supabase/migrations/` to create the RLS-protected profiles table.

New magic-link users receive `customer` role automatically. To preserve the demonstration admin account, create or sign in once with its real email address, then run this in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', display_name = 'Admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('admin@example.com')
);
```

Replace `admin@example.com` with the demonstration account email. The admin email inbox must be accessible because admin login now uses the same magic-link flow.
