# GitHub repo to single file

## Note on Future Development
Please be aware that this application is in active development and hasn't been extensively tested yet. If you encounter any performance issues or bugs, contributions are greatly appreciated - feel free to open a pull request, and we can work together to improve it. Thank you for your understanding and support.

## About 'GitHub repo to single file'

This is a GitHub repository to single file downloader, written in and for educational and demonstrational purposes.

A lightweight and convenient application that downloads any GitHub repository as a single, well-structured text file. The output format is: === filename === followed by the complete file content.

Based on tech stack:
- [Node.js](https://nodejs.org),
- [TypeScript](https://www.typescriptlang.org),
- [GitHub REST API](https://docs.github.com/en/rest),
- [FS Promises API](https://nodejs.org/api/fs.html),
- [Dotenv](https://github.com/motdotla/dotenv).

## Getting Started

1. Install:
``` bash
git clone [repository-url]
cd /path/to/github-repo-to-single-file/
npm install
```

2. Configuration (copy the .env.example file to .env and configure your settings):
``` bash
cp .env.example .env
```

``` bash
GITHUB_TOKEN=your_github_token_here (optional)

INCLUDE_PATTERNS=
EXCLUDE_PATTERNS=*.log,*lock*,*.tmp,*.temp,*.swp,*.swo,*.jpg,*.jpeg,*.png,*.gif,*.bmp,*.webp,*.svg,*.ico,*.mp4,*.avi,*.mov,*.mkv,*.mp3,*.wav,*.pdf,*.doc,*.docx,*.xls,*.xlsx,*.zip,*.tar,*.gz,*.rar
OUTPUT_DIR=./output
API_DELAY_MS=100
```

### Important Notes
- The target repository is NOT specified here. It is provided as a command-line argument when running the application.
- The .env file should never be committed to version control.

### About GitHub Token

The GITHUB_TOKEN is optional but recommended for two main reasons:

1. Access to Private Repositories:
   - Without a token: Can only download PUBLIC repositories.
   - With a token (with 'repo' scope): Can download BOTH public and PRIVATE repositories.

2. Higher API Rate Limits:
   | Condition        | Requests per Hour | Experience                           |
   |------------------|-------------------|--------------------------------------|
   | Without Token    | 60 requests       | Frequent blocks, slower downloads    |
   | With Token       | 5000 requests     | Stable, faster, more reliable        |

Using a token allows you to decrease the API_DELAY_MS setting for faster downloads without hitting rate limits.

Additional Benefits:
- Priority in API queue: Authenticated requests are processed faster.
- Traceability: GitHub logs requests under your account.

When You DON'T Need a Token:
- You are downloading only 1-2 small public repositories per day.
- The repository has very few files (less than 60).
- You don't mind longer delays between requests (API_DELAY_MS=1000+).

How to Create a Token (2 minutes):
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Set expiration (e.g., 30 days)
4. Select scopes:
   - For PUBLIC repos only: Check `public_repo`
   - For PUBLIC & PRIVATE repos: Check `repo`
5. Generate token and IMMEDIATELY copy it to your .env file.

### Usage

The application provides two main commands for downloading repositories:

1. BUILD AND RUN (for development or first use after changes):
``` bash
npm start -- facebook/react
```
This command will: 1) build the TypeScript code, 2) run the downloader.

2. FAST DOWNLOAD (for repeated use after initial build):
``` bash
npm run download -- facebook/react
```
This command runs the already built application directly, skipping the build step for faster execution.

Both commands accept the same arguments:
``` bash
npm start -- <repository> [branch] [output-file]
npm run download -- <repository> [branch] [output-file]
```
- repository: Required. Must be in the format "owner/repo_name".
- branch: Optional. The branch to download (defaults to "main").
- output-file: Optional. The name for the output text file (defaults to "owner_repo_branch.txt").

Examples:
``` bash
npm start -- facebook/react
npm run download -- facebook/react main
npm run download -- facebook/react main react_source_code.txt
npm start -- vuejs/core next
npm run download -- microsoft/TypeScript main typescript_code.txt
```

### What the application does
- Retrieves the file tree of the specified repository and branch via the GitHub API.
- Applies the include and exclude pattern filters to the file list.
- Downloads the content of all matching files.
- Creates a single output file with a clear structure, saving it to the configured OUTPUT_DIR.
- Displays download progress and a final summary.

## Pattern System - Complete Guide

The application supports flexible pattern matching system with three pattern types:

1. SIMPLE PATTERNS (file name matching):
- *.log - Matches files ending with .log
- *lock* - Matches files containing "lock" anywhere in name (package-lock.json, yarn.lock)
- *.jpg - Matches files ending with .jpg

2. GLOB PATTERNS (path matching with wildcards):
- **/*.js - Matches .js files in ANY directory and subdirectory
- src/**/* - Matches ALL files inside src/ and all its subdirectories
- docs/*.md - Matches .md files in docs/ directory (not in subdirectories)
- tests/**/*.test.js - Matches .test.js files in tests/ and all subdirectories

3. EXACT PATTERNS (full path matching):
- package.json - Matches exactly package.json in root
- README.md - Matches exactly README.md in root

### Pattern Priority and Logic
- If INCLUDE_PATTERNS is empty → ALL files are considered for inclusion
- If INCLUDE_PATTERNS has patterns → file must match AT LEAST ONE pattern to be included
- If file matches ANY pattern in EXCLUDE_PATTERNS → it's excluded (even if matches include patterns)
- Include patterns are checked first, then exclude patterns

### Common Pattern Examples

Example 1: Download only source code files
``` bash
INCLUDE_PATTERNS=**/*.js,**/*.ts,**/*.jsx,**/*.tsx,**/*.py,**/*.java,**/*.go
EXCLUDE_PATTERNS=**/*.test.*,**/*.spec.*,**/node_modules/**,**/dist/**
```

Example 2: Download documentation only
``` bash
INCLUDE_PATTERNS=**/*.md,**/*.txt,docs/**/*
EXCLUDE_PATTERNS=
```

Example 3: Exclude all media and binary files (default setup)
``` bash
INCLUDE_PATTERNS=
EXCLUDE_PATTERNS=*.log,*lock*,*.tmp,*.temp,*.swp,*.swo,*.jpg,*.jpeg,*.png,*.gif,*.bmp,*.webp,*.svg,*.ico,*.mp4,*.avi,*.mov,*.mkv,*.mp3,*.wav,*.pdf,*.doc,*.docx,*.xls,*.xlsx,*.zip,*.tar,*.gz,*.rar
```

Example 4: Download specific project structure
``` bash
INCLUDE_PATTERNS=src/**/*.js,src/**/*.ts,public/**/*,package.json,README.md
EXCLUDE_PATTERNS=**/*.test.js,**/*.spec.js,**/node_modules/**
```

Example 5: Complex filtering
``` bash
INCLUDE_PATTERNS=src/**/*
EXCLUDE_PATTERNS=src/**/*.test.*,src/**/*.spec.*,src/**/test/**,src/**/*.min.*
```

### Advanced Usage Examples

Example 1: Download React repository source files only
``` bash
INCLUDE_PATTERNS=src/**/*.js,src/**/*.jsx,src/**/*.ts,src/**/*.tsx
EXCLUDE_PATTERNS=**/*.test.*,**/*.spec.*,**/node_modules/**,**/dist/**
Command: npm run download -- facebook/react
```

Example 2: Download Python project without tests and virtual environments
``` bash
INCLUDE_PATTERNS=**/*.py
EXCLUDE_PATTERNS=**/*test*.py,**/tests/**,**/venv/**,**/.env**
Command: npm start -- django/django
```

Example 3: Download specific folder structure
``` bash
INCLUDE_PATTERNS=lib/**/*,include/**/*,src/**/*.cpp,src/**/*.hpp,CMakeLists.txt,README.md
EXCLUDE_PATTERNS=**/test/**,**/examples/**,**/*.o,**/*.so
Command: npm run download -- openssl/openssl
```

## Output File Structure

The generated file will have the following format:
``` bash
GitHub Repository: owner/repo
Branch: main
Generated: 2024-01-15T10:30:00.000Z
Total Files: 42
================================================================================

=== src/index.js ===
Size: 1234 characters
------------------------------------------------------------
// Actual file content here...
...

=== README.md ===
Size: 567 characters
------------------------------------------------------------
# Project Title
...
```

## Environment Variables (.env) Summary
- GITHUB_TOKEN: Your GitHub Personal Access Token (optional).
- INCLUDE_PATTERNS: Comma-separated list of patterns. If empty, all files are included (subject to exclude rules).
- EXCLUDE_PATTERNS: Comma-separated list of patterns for files/directories to exclude.
- OUTPUT_DIR: Directory where the output file will be saved (default: ./output).
- API_DELAY_MS: Delay in milliseconds between consecutive API requests to avoid rate limiting (default: 100).

## Pattern Tips
- Use ** to match any directory level (including zero levels)
- Use * to match any characters within a file/directory name
- Patterns are case-sensitive on Linux/macOS
- You can mix simple and glob patterns in the same list
- Test patterns with simple examples before applying to large repositories

## Notes
- The application automatically builds after installation (postinstall script).
- The application handles GitHub API rate limits and will automatically wait if necessary.
- Files that fail to download will have a placeholder message in the output.
- The output directory will be created if it doesn't exist.
- Ensure your .env file is listed in your .gitignore.
- Standard development artifacts (like .git, node_modules, dist, build, coverage) are excluded from the GitHub tree API response and therefore do not need to be filtered by this application.

## Troubleshooting
- If no files are downloaded: Check your INCLUDE_PATTERNS - if set, files must match at least one pattern.
- If too many files are downloaded: Adjust your EXCLUDE_PATTERNS to be more specific.
- If pattern doesn't work: Use simpler patterns and test incrementally.
- If you get "Cannot find module" errors: Run `npm run build` to compile TypeScript code.

That's it! Thank you!

## Screenshots

<img width="1090" height="535" alt="2025-12-25_11-00-39" src="https://github.com/user-attachments/assets/993ab234-869d-457b-aeb4-3d5cdb937996" />

## License

The 'GitHub repo to single file' is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Third-Party Licenses
This project uses third-party software components. Their respective licenses can be found in the LICENSE-3rd-party.md file.
