## Jupyter 中 `import torch` 报 WinError 1114

在 Windows 上，同一个 Python 解释器在命令行中能正常 `import torch`，进入 Jupyter（包括 IDE 的 Jupyter 插件）后却报错，常见原因是 **pyzmq 自带的旧版 `msvcp140.dll`** 先被加载，导致 Torch 的 `c10.dll` 初始化失败

典型报错：

```text
[WinError 1114] 动态链接库(DLL)初始化例程失败
Error loading "...\Lib\site-packages\torch\lib\c10.dll" or one of its dependencies.
```

### 原因

Jupyter kernel 启动时会先导入 `zmq`。旧版 pyzmq 的 wheel 里带了自己的 C++ 运行库（`pyzmq.libs\msvcp140.dll`），版本比系统目录中的 `msvcp140.dll` 低。进程里已经有一份旧版同名 DLL，之后 Torch 加载依赖时会复用它，`c10.dll` 初始化就会失败

Windows 在同一进程中对同名 DLL 只保留先加载的那一份，所以导入顺序会直接影响结果

| 对比项                    | 示例版本        |
| ------------------------- | --------------- |
| pyzmq 附带的 msvcp140.dll | `14.16.27033.0` |
| 系统目录中的 msvcp140.dll | `14.51.36247.0` |

> [!NOTE]
> 系统已经装了最新的 VC++ 运行库，也可能被第三方包附带的旧 DLL 抢先加载而失效

### 排查思路

#### 先确认解释器和复现范围

直接用 kernel 对应的解释器测试：

```powershell
& python -c "import torch; print(torch.__version__); print(torch.rand(2))"
```

命令行正常、Jupyter 报错，说明问题出在 Jupyter 的启动环境里。如果换成原版 Jupyter 也能复现，可以排除编辑器插件的问题

> [!TIP]
> 用 `sys.executable` 和模块的 `__file__` 核对实际路径。Python 装在某一个目录中，也不代表 `zmq` 也来自这里，它可能来自 `%APPDATA%\Python\Python311\site-packages`（用户目录的 `--user` 安装）

#### 用新进程做导入顺序实验

每项测试都开一个新的 Python 进程，避免上一项已加载的 DLL 干扰：

| 测试                           | 结果 |
| ------------------------------ | ---- |
| 直接导入 Torch                 | 成功 |
| 先导入 IPython，再导入 Torch   | 成功 |
| 先导入 NumPy，再导入 Torch     | 成功 |
| 先导入 ipykernel，再导入 Torch | 报错 |
| 先导入 zmq，再导入 Torch       | 报错 |
| 先导入 Torch，再导入 zmq       | 成功 |

最小复现命令：

```powershell
& python -c "import zmq; import torch"
```

`ipykernel` 依赖 `zmq`，所以它也会触发。先 `import torch` 再 `import zmq` 能成功，是这类问题的典型特征

#### 检查进程实际加载的 DLL

在导入 `zmq` 前后对比进程加载的模块，可以看到 `pyzmq.libs\msvcp140.dll` 被加载进来。进一步的对照：

| 操作                                                      | 结果 |
| --------------------------------------------------------- | ---- |
| 不导入 zmq，只预加载它附带的旧 msvcp140.dll，再导入 Torch | 报错 |
| 先预加载系统的新版 msvcp140.dll，再导入 zmq 和 Torch      | 成功 |

这两项说明旧 DLL 本身就足以触发报错，和 zmq 的其他代码无关

#### 在完整 kernel 中验证

在 kernel 启动前预加载系统的 `msvcp140.dll`，不改动任何持久配置，`import torch`、张量运算和 CUDA 检查都能通过。这个办法适合在修复前确认判断，也可作为临时绕过手段

### 修复方法

升级实际被加载的那份 pyzmq。若它位于用户目录，需要带上 `--user`：

```powershell
& python -m pip install --user --upgrade pyzmq
```

升级后**退出原有 kernel，重启 Jupyter / Neovim**，让新进程重新加载 DLL。先用最小命令检查：

```powershell
& python -c "import zmq; import torch; print(zmq.__version__, torch.__version__)"
```

再到 notebook 里验证：

```python
import torch

print(torch.__version__)
print(torch.arange(4).sum().item())  # 输出 6
```

> [!TIP]
> 如果系统级 site-packages 和用户目录各装了一份 pyzmq，只升级其中一份可能不起作用。用 `python -c "import zmq; print(zmq.__file__)"` 确认哪一份被实际加载

### 经验总结

- 报错指向 `c10.dll`，不一定是这个文件本身有问题，它的依赖项，或进程里先加载的同名 DLL，都可能导致初始化失败
- 同一个解释器在命令行和 Jupyter 中表现不同，优先检查启动时的导入顺序和实际加载的 DLL
- 遇到 DLL 冲突，用“新进程 + 控制导入顺序”的小实验逐项排除，比反复重装 Torch 更快
- 多处安装同一个包（系统、用户目录、虚拟环境）时，先确认 `__file__`，再决定升级哪一份
- 另一台电脑正常，可以作为对照线索：对比两边的 `msvcp140.dll` 来源和版本，以及 `zmq` 的安装位置
- 其他带有自带运行库的包（如部分 wheel 中的 `*.libs` 目录）也可能出现类似冲突，排查方法相同
