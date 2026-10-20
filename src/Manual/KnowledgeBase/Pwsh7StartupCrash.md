## PowerShell 7 启动即闪退

> [!TIP]
> PowerShell 7 在 Windows 上的程序名是 `pwsh.exe`，和系统自带的 Windows PowerShell 5.1（`powershell.exe`）是两个独立的软件，可以同时存在

> [!Note]
> 本节只讨论 **PowerShell 7**（`pwsh`）在 **简体中文** 系统上启动时直接退出的问题

### 现象

在 Windows Terminal 中打开 PowerShell 7 配置文件，窗口一闪而过，或者终端提示进程已退出，退出代码为 `2148734499`（`0x80131623`），日志中可以看到类似内容：

```text
Process terminated.
totalWidth ('-17') must be a non-negative value. (Parameter 'totalWidth')
   at System.String.PadRight(Int32 totalWidth, Char paddingChar)
   at Microsoft.PowerShell.UpdatesNotification.ShowUpdateNotification(PSHostUserInterface hostUI)
```

### 原因

PowerShell 每次启动都会在后台检查是否有新版本，发现新版本后，会在启动时打印一段提示框

提示框需要用空格补齐对齐，补多少空格由框的宽度 − 文本宽度计算

在 **简体中文** 下，提示文本比预期长，算出来的宽度变成了负数，`PadRight(-17)` 抛出异常，而这一步发生在控制台启动阶段，异常无法处理，整个进程就直接退出了

所以这是 PowerShell 本身的 Bug。已经反馈为 [PowerShell/PowerShell#28131](https://github.com/PowerShell/PowerShell/issues/28131)，写本文时尚未修复（2026年10月20日）

> [!Tip]
> 只要日志里有 `ShowUpdateNotification`，就是该问题。如果是别的堆栈，请不要套用本节的方法

### 解决方式

关掉更新检查

PowerShell 通过环境变量 `POWERSHELL_UPDATECHECK` 控制更新检查，设置为 `Off` 即可关闭

**永久关闭**

1. 按 `Win + R` 输入 `cmd` 回车，或者在 Windows Terminal 中打开 **Windows PowerShell**
2. 输入以下命令并回车：

```powershell
setx POWERSHELL_UPDATECHECK Off
```

3. 关闭所有终端窗口，重新打开 PowerShell 7

也可以手动设置：`Win + R` 输入 `sysdm.cpl` → **高级** → **环境变量** → 在用户变量中 **新建**，变量名 `POWERSHELL_UPDATECHECK`，变量值 `Off`

**临时启动一次**

在 cmd 中输入：

```bat
set POWERSHELL_UPDATECHECK=Off && pwsh
```

> [!Warning]
> 必须用 **Windows PowerShell** 或 **cmd** 来执行上面的命令，因为 PowerShell 7 本身已经打不开了）

### 关闭更新检查之后

关闭后 PowerShell 不会再提醒你更新，如果需要定期自己检查版本：

```powershell
winget upgrade Microsoft.PowerShell
```

> [!Tip]
> 在能正常打开的终端里输入 `$PSVersionTable.PSVersion` 可以查看当前 PowerShell 的版本号

> [!Important]
> 如果以后官方修复了这个 Bug，可以把环境变量删掉，恢复默认的更新提示，到 issue 页面看一眼修复状态即可
