Set-Location C:\Users\46963\IdeaProjects\llm\llm_forntend
$dateString = Get-Date -Format "yyyy-MM-dd"
$message = Read-Host "请输入提交信息";$message +=' ';$message += $dateString ; git add . ; git commit -m $message
Write-Host "已提交更改: $message"

$confirmation = Read-Host "是否推送到远处仓库？ (y/n)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host "推送至远程仓库"
    git push -f origin main
} else {
    Write-Host "推送取消"
}