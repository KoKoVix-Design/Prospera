param(
  [string]$Username = "KoKoVix-Design",
  [string]$Repo = "Kokovix"
)

$RemoteUrl = "https://github.com/$Username/$Repo.git"
$PagesUrl = "https://$Username.github.io/$Repo/"

Write-Host "Using username: $Username  repo: $Repo"

if (-not (Test-Path -Path ".git")) {
  Write-Host "Initializing git repository..."
  git init
}

$origin = git remote get-url origin 2>$null
if (-not $origin) {
  Write-Host "Adding remote: $RemoteUrl"
  git remote add origin $RemoteUrl
}

git add .
try {
  git commit -m "Publish site"
} catch {
  Write-Host "No changes to commit or commit failed."
}

git branch -M main
git push -u origin main

Write-Host "Pushed to $RemoteUrl"
Write-Host "Opening Pages URL: $PagesUrl"
Start-Process $PagesUrl
