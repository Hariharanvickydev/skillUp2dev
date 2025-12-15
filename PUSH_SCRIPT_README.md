# Git Push Script

## Setup

1. **Edit the script**:
```bash
nano push-to-github.sh
```

2. **Replace the token placeholder**:
```bash
GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
```
Change to:
```bash
```

3. **Save and exit** (Ctrl+X, then Y, then Enter)

## Usage

**Push all branches**:
```bash
./push-to-github.sh
```

This will push `master`, `prod`, `qa`, and `dev` branches to GitHub.

## Security

✅ The script is **git-ignored** - it won't be committed to the repository  
✅ Your token stays **local only**  
✅ Safe to use for future pushes

## Updating Token

When you regenerate your GitHub token:
1. Edit `push-to-github.sh`
2. Replace the old token with the new one
3. Save and run `./push-to-github.sh`

## Location

`/Users/ideas2it/Documents/AI agent/push-to-github.sh`
