# Synthesize one WAV per transcript line with the WinRT (OneCore) voices.
# usage: powershell -File tts.ps1 <jobs.json> <outDir>
# jobs.json: [{ "file": "m1-000.wav", "voice": "Mark", "pitch": "+0%", "rate": "0%", "text": "..." }]
param([string]$Jobs, [string]$OutDir)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq "AsTask" -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq "IAsyncOperation``1"
} | Select-Object -First 1
function Await($op, [Type]$type) {
  $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait() | Out-Null
  $task.Result
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voices = @{}
foreach ($v in [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices) { $voices[$v.DisplayName] = $v }

$jobsList = Get-Content -Raw -Encoding UTF8 $Jobs | ConvertFrom-Json
foreach ($job in $jobsList) {
  $voice = $voices["Microsoft $($job.voice)"]
  if (-not $voice) { throw "Voice not found: $($job.voice)" }
  $synth.Voice = $voice
  $escaped = [System.Security.SecurityElement]::Escape($job.text)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
    "<voice name='$($voice.DisplayName)'><prosody pitch='$($job.pitch)' rate='$($job.rate)'>$escaped</prosody></voice></speak>"
  $stream = Await ($synth.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $size = [uint32]$stream.Size
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  [void](Await ($reader.LoadAsync($size)) ([uint32]))
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  [System.IO.File]::WriteAllBytes((Join-Path $OutDir $job.file), $bytes)
  $reader.Dispose(); $stream.Dispose()
}
"done $($jobsList.Count)"
