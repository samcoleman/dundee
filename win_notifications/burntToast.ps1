

function Show-Notification {
  [cmdletbinding()]
  Param (
      [string] $url,
      [string] $ToastTitle,
      [string] $ToastText
  )

  $xml =@"
<toast activationType="protocol" launch="$url">
  <visual>
    <binding template="ToastGeneric">
      <text id="1">$ToastTitle</text>
      <text id="2">$ToastText</text>
      <image placement="hero" src="file:///C:\Users\samcoleman\Documents\ToastNotificationScript2.3.0\image.png"/>
    </binding>
  </visual>
  <actions>
  <action activationType="protocol" arguments='$url&amp;action=B5&amp;chk=xQGj5rJJPxaLCUrCd41e17nCsx9A2u9GZywf' content="Buy 5k"/>
  <action activationType="protocol" arguments='$url&amp;action=B10&amp;chk=xQGj5rJJPxaLCUrCd41e17nCsx9A2u9GZywf' content="Buy 10k"/>
  <action activationType="protocol" arguments='$url&amp;action=S5&amp;chk=xQGj5rJJPxaLCUrCd41e17nCsx9A2u9GZywf' content="Sell 5k"/>
  <action activationType="protocol" arguments='$url&amp;action=S10&amp;chk=xQGj5rJJPxaLCUrCd41e17nCsx9A2u9GZywf' content="Sell 10k"/>
  </actions>
</toast>
"@


  $XmlDocument = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]::New()
  $XmlDocument.loadXml($xml)

  #$toast = New-Object Windows.UI.Notifications.ToastNotification -ArgumentList $XmlDocument

  function WrapToastEvent {
    param($target, $eventName)

    Add-Type -Path PoshWinRT.dll
    $wrapper = new-object "PoshWinRT.EventWrapper[Windows.UI.Notifications.ToastNotification,System.Object]"
    $wrapper.Register($target, $eventName)
  }


  $AppId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'

  $toast = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]::New($XmlDocument)

  [void][Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime];
  $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppId);


  #Register-ObjectEvent -InputObject (WrapToastEvent $toast 'Activated') -EventName FireEvent -Action {
  #  Write-Host "Trigger" -ForegroundColor Green
  #  Write-Host arguments:, $args[1].Result.arguments
  #  Write-Host textBox:, $args[1].Result.userinput['textBox']
  #}

  $notifier.Show($toast)
}
