# 🚀 Quick Local Setup Script

Write-Host "🔧 Setting up Gimme for local development..." -ForegroundColor Cyan
Write-Host ""

# Create backend .env
$backendEnv = @"
# Supabase Configuration (YOUR ACTUAL CREDENTIALS)
SUPABASE_URL=https://pdobpagdgoeogtdgxpra.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2JwYWdkZ29lb2d0ZGd4cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzg1ODIsImV4cCI6MjA4NDgxNDU4Mn0.2oB7zxJYNwYoEAYZW-Dh5WphlPVH5WRuyBYdHxdKl5E

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS - Frontend URL (for local development)
CORS_ORIGIN=http://localhost:5173
"@

# Create frontend .env
$frontendEnv = @"
# Frontend API URL
# For local development (backend running on localhost)
VITE_API_URL=http://localhost:3001
"@

# Write backend .env
$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "✅ Created backend/.env" -ForegroundColor Green

# Write frontend .env
$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Created .env" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Local environment files created!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd backend" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "In another terminal:" -ForegroundColor Yellow
Write-Host "1. npm install" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Your app will run at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
