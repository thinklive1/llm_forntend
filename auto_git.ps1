Set-Location C:\Users\46963\IdeaProjects\llm\llm_forntend
$dateString = Get-Date -Format "yyyy-MM-dd"
$message = Read-Host "请输入提交信息"+$dateString ; git add . ; git commit -m $message
Write-Host "已提交更改: $message"