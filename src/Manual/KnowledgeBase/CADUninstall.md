## AutoCAD 卸载

Autodesk 没有统一的一键卸载工具，需要按官方 Clean Uninstall 流程手动走完

1. 控制面板卸载
2. 卸载共享组件（ODIS/许可/身份管理）
3. 删除残留文件夹
4. 清理注册表
5. 卸载 Genuine Service

> [!IMPORTANT]
> 顺序很重要，特别是 Genuine Service 必须最后处理

以下流程基于 Autodesk [官方文档](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/Clean-uninstall.html)整理

> [!IMPORTANT]
> 全文默认 CAD 版本为 AutoCAD 2024 ，且安装在默认路径下，如有自定义安装路径请自行替换。老版本的 AutoCAD 卸载方式略有不同

### 准备工作

- 备份自定义文件：CUIX、AutoLISP、PGP 文件、模板、字体等个性化配置会在卸载中被删除，如需要保留请先复制出来
- 重启一次电脑

### 卸载所有 Autodesk 程序

1. 按 Win 键输入 `appwiz.cpl` 回车，打开控制面板的"程序和功能"
2. 按从小到大、先周边后主程序的顺序卸载：先卸载语言包、附加模块、Material Library
    1. Medium Resolution Image Library
    2. Base Resolution
    3. Material Library
    4. 卸载 AutoCAD 2024 主程序
3. 除 **Autodesk Genuine Service 外**，卸载列表中所有 Autodesk 开头的条目（如 Autodesk Access、Autodesk Genuine 之外的组件、Autodesk Licensing Service 相关项等）

### 卸载共享组件

这些组件不会出现在控制面板里，需要手动运行各自的卸载程序 ：

| 组件                      | 路径与操作                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| ODIS 安装器               | 以管理员运行 `C:\Program Files\Autodesk\AdODIS\V1\RemoveODIS.exe`                                 |
| Licensing Desktop Service | 以管理员运行 `C:\Program Files (x86)\Common Files\Autodesk Shared\AdskLicensing` 下的 `Uninstall` |
| Identity Manager          | 以管理员运行 `C:\Program Files\Autodesk\AdskIdentityManager\uninstall.exe`，等待文件夹清空        |

然后下载运行 [Microsoft Program Install and Uninstall Troubleshooter](https://aka.ms/Program_Install_and_Uninstall)，选择卸载，检查并清除所有残留的 Autodesk 条目（仍跳过 Genuine Service）；如果一次查出多个条目，需要重启该工具多次处理

### 删除残留文件和文件夹

1. Win 键输入 `%temp%` 回车，全选删除 Temp 文件夹内的内容，跳过占用中的文件
2. 打开 `C:\ProgramData\FLEXnet`，删除其中以 `adsk` 开头的三个文件（其中一个是隐藏文件，需在资源管理器中开启显示隐藏项目）——这一步会清除许可证信息
3. 删除以下文件夹

```text
C:\Program Files\Autodesk
C:\Program Files\Common Files\Autodesk Shared
C:\Program Files (x86)\Autodesk
C:\Program Files (x86)\Common Files\Autodesk Shared
C:\ProgramData\Autodesk            (隐藏)
%localappdata%\Autodesk            (隐藏)
%appdata%\Autodesk                 (隐藏)
C:\Users\Public\Documents\Autodesk
```

### 清理注册表并收尾

1. Win+R 输入 `regedit` 打开注册表编辑器（建议先通过文件->导出备份整个注册表）
2. 删除以下两个子项 ：

    ```text
    HKLM:\SOFTWARE\Autodesk
    HKCU:\SOFTWARE\Autodesk
    ```

3. 再回到 `appwiz.cpl`，卸载 **Autodesk Genuine Service**。它只有在所有 Autodesk 软件、文件和注册表项删完后才能正常卸载；若仍失败，用上面的 Microsoft Troubleshooter 卸载
4. 重启电脑完成整个流程

如果只打算重新安装而非彻底弃用，重装前官方还建议再次清空 `%TEMP%` 并暂时关闭杀毒软件，避免安装过程被拦截
