# Delete artifacts action

Github action ti delete artifact.

## Inputs

## `days`

**Required** Artifacts older than this number of days will be deleted.

## `max-artifacts-to-delete`

**Required** Max artifacts to delete (default=100, max=100) !important keep this number low to don't reach github api rate limit.

## `dry-run`

**Required** Dry run 'Yes' or 'No' (defaulf: yes).

## Example usage

```yml
uses: heidi-pay/gha-delete-artifacts@v1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  days: 7
  max-artifacts-to-delete: 50
  dry-run: yes
```
