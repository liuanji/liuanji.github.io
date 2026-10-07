# servermonitor

部署在 brezel 上的轻量 GPU 监控网站。brezel 读取本机 GPU，并通过 SSH 只读采集 toast 和 croissant；可在三台单机页面和 All 汇总页面之间切换。

## 功能

- 实时展示 GPU 利用率、每张卡的算力负载、显存、温度、功耗、用户和计算进程
- 通过 All、brezel、toast、croissant 选项卡切换汇总或单机页面
- 通过统一选项卡汇总过去一小时、一天、一周、一个月、三个月和一年的 GPU 利用率、算力负载、显存占用、总功耗与用户排行
- 查看 1 小时、24 小时、7 天和 30 天的算力负载、显存占用与在用 GPU 数量趋势
- 按活跃 GPU 小时和估算的加权 GPU 小时统计用户排行
- 只保存汇总：分钟汇总保留 48 小时，小时汇总默认保留 365 天；进程信息只保留每台机器最新一次采样

## 工作方式

服务每 30 秒并行采集三台机器：brezel 在本机执行命令，toast 和 croissant 通过无交互 SSH 执行相同命令。

每台机器执行：

- `nvidia-smi`：读取 GPU 与计算进程指标
- `ps`：把 NVIDIA 进程 PID 映射到 Linux 用户名

结果写入本机 SQLite。网站和采集器只使用 Python 标准库，没有运行时第三方依赖。

## 启动

要求 Python 3.11 或更高版本：

```bash
python3 -m servermonitor
```

服务监听 `127.0.0.1:8765`，启动后立即进行第一轮采集。用户排行从相邻的两次成功采样开始累计。

也可以只采集一次并检查结果：

```bash
python3 -m servermonitor collect
```

## 从自己的电脑访问

网站默认不暴露到网络。建立 SSH 隧道：

```bash
ssh -N -L 8876:127.0.0.1:8765 brezel
```

保持命令运行并打开 `http://127.0.0.1:8876`，再使用页面中的主机选项卡切换。关闭隧道只会停止浏览，不会影响 brezel 继续统计。

## 配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `GPU_MONITOR_HOST` | 当前主机名 | 页面显示的本机名称 |
| `GPU_MONITOR_COLLECT_LOCAL` | `1` | 设为 `0` 时不采集本机（例如没有 GPU 的跳板机），并忽略 `GPU_MONITOR_HOST` |
| `GPU_MONITOR_REMOTE_HOSTS` | 空 | 由本机通过 SSH 采集的主机，逗号分隔 |
| `GPU_MONITOR_DATABASE` | `./data/servermonitor.sqlite3` | SQLite 文件路径 |
| `GPU_MONITOR_INTERVAL` | `30` | 采样间隔，最小 10 秒 |
| `GPU_MONITOR_TIMEOUT` | `12` | 单次本机采集超时秒数 |
| `GPU_MONITOR_BIND` | `127.0.0.1` | 网站监听地址 |
| `GPU_MONITOR_PORT` | `8765` | 网站端口 |
| `GPU_MONITOR_ROLLUP_RETENTION_DAYS` | `365` | 小时汇总保留天数 |

服务没有登录功能，不建议直接监听公网地址，因为页面会显示用户名和进程名。brezel 保持监听 `127.0.0.1:8765`，通过 SSH 本地转发访问。

## 常驻方式

brezel 使用 `cron + flock`：cron 每分钟检查一次，服务已经运行时立即退出，服务异常停止时则自动重新启动。toast 和 croissant 不需要运行网站进程。

常驻入口是 `deploy/run-servermonitor.sh`，运行日志位于 `data/servermonitor.log`。日志只记录主机开始采集失败、错误信息变化和恢复（成功采集仅在 `--verbose` 时记录），达到 1 MB 后轮转并只保留 1 份备份，最多约 2 MB。`deploy/servermonitor.service` 仍可用于具备管理员权限的标准 systemd 部署。

### 在没有 GPU 的跳板机上运行

关闭本机采集，把三台机器都列为远程主机。跳板机需要能无交互 SSH 登录每台机器，`ssh -o BatchMode=yes brezel true` 应直接成功。先采集一次检查结果：

```bash
GPU_MONITOR_COLLECT_LOCAL=0 GPU_MONITOR_REMOTE_HOSTS=brezel,toast,croissant python3 -m servermonitor collect
```

cron 配置如下。`/usr/bin/python3` 低于 3.11 时，用 `GPU_MONITOR_PYTHON` 指定解释器：

```
* * * * * GPU_MONITOR_COLLECT_LOCAL=0 GPU_MONITOR_REMOTE_HOSTS=brezel,toast,croissant GPU_MONITOR_PYTHON=/usr/bin/python3.11 /path/to/servermonitor/deploy/run-servermonitor.sh
```

改由跳板机采集后，删除 brezel 上原来的 cron 任务，避免重复采集。主机名保持不变时，可以把 brezel 上的 `data/servermonitor.sqlite3` 复制过来继续使用历史数据（先停止 brezel 上的进程）。

## 指标和保留策略

- **GPU 利用率**：当前有计算进程或算力负载达到 5% 的 GPU 数量除以 GPU 总数。
- **算力负载**：`nvidia-smi utilization.gpu`；首页显示 8 张卡当前值的算术平均。
- **总功耗**：所选单机或 All 页面中所有 GPU 的功耗之和；首页显示当前值，时间选项卡显示窗口内平均值。
- **历史趋势**：48 小时内使用分钟汇总，更长范围使用小时汇总。
- **存储方式**：不保存原始采样和进程历史。每次采样直接累加到每张 GPU、每个用户的分钟汇总和小时汇总中；进程名、PID 只存在于每台机器最新一次采样的快照里。
- **空间上限**：分钟汇总保留 48 小时（约 4 MB），小时汇总保留 365 天（每年约 10 MB），过期行每 30 分钟左右清理一次，SQLite 会复用已释放空间。3 台 8 卡机器满一年约 15–20 MB；WAL 文件在检查点后截断到 1 MB 以内。
- **旧数据库**：首次启动新版本时，旧版保存的原始采样会自动转换：保留全部小时汇总，用最近 48 小时的原始采样生成分钟汇总和最新快照，然后删除原始采样表并 VACUUM。转换不可逆，升级前建议先备份 `data/servermonitor.sqlite3`。

### 用户统计口径

- **活跃 GPU 小时**：同一用户在同一 GPU 上出现计算进程即累计一份时间；多个进程不会重复计算，同时占用多张卡会分别累计。
- **显存 GB·小时**：用户计算进程占用的显存乘以采样时长。
- **加权 GPU 小时**：GPU 算力负载乘以时间；多人共享一张卡时按进程显存份额分配。这是估算值，不等同于硬件级用户算力计量。
- **窗口精度**：48 小时以内的统计窗口精确到分钟，更长的窗口精确到小时；窗口起点落在某个汇总桶中间时，按重叠比例计入该桶。

## 测试

```bash
python3 -m unittest discover -v
```
