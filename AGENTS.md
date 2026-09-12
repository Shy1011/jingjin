# 自我精进（jingjin）· 维护说明

这是一个已经部署到 GitHub Pages 的 PWA，本文件夹就是 git 仓库根目录。

- 线上地址：https://shy1011.github.io/jingjin/
- 仓库：https://github.com/Shy1011/jingjin
- 落地页：作息（`page2`，HTML 里直接带 `active` 类，不靠 JS 切换）

## 改动别人的应用时，标准流程

1. 改 `index.html`（应用全部代码都在里面：HTML + CSS + JS）
2. **把 `sw.js` 顶部的 `VERSION` 递增**（`v1` → `v2` → `v3` …）
3. `git add -A && git commit -m "..." && git push`
4. GitHub Pages 约 40 秒后自动重新构建
5. 手机上打开应用**两次**：第一次仍显示旧版并在后台下载新版，第二次才是新版

### 第 2 步不能省

Service Worker 采用「先给缓存、后台更新」策略，目的是让打开瞬间就有画面。
代价是：**版本号不变，浏览器就认为缓存还是最新的，永远不去拉新版**，用户会一直卡在旧版本上。

## 验证

```powershell
# 构建状态（status 应为 built）
gh api /repos/Shy1011/jingjin/pages/builds/latest

# 线上内容是否已更新
(Invoke-WebRequest https://shy1011.github.io/jingjin/ -UseBasicParsing).Content
```

## 结构约定

- 5 个页面，**DOM 顺序即 `switchPage` 索引**：
  `打卡(0)` / `作息(1)` / `修身(2)` / `记录(3)` / `饮食(4)`
- 增删页面必须同时改三处：HTML 里的 `page` div、`.tabbar` 里的 tab 按钮、
  `switchPage()` 里的索引判断。三者错位页面就会串。
- 数据全部存在手机 `localStorage`，**没有任何外部网络请求**（零 `fetch`、零外部 URL），
  所以缓存之后完全离线可用。
- 文件里不含任何密钥，可以公开。

### 改作息表要小心

作息页的时间行是这种结构：

```html
<tr data-sched="weekdayTable" data-start="18:30" data-end="19:00">
  <td class="t">18:30 - 19:00</td>
  <td class="c"><b>在公司吃晚饭</b><span>说明文字</span></td>
</tr>
```

- `data-start` / `data-end`（格式 `HH:MM`，支持 `24:00`）**驱动「现在」高亮和自动定位**，
  改了显示文字就必须同步改这两个属性，否则高亮会错位。
- `data-sched` 只能是 `weekdayTable` 或 `weekendTable`。
- 跨零点的行（如睡觉 `24:00` → `08:00`）由 `tickNow()` 里的 `if(e<=s) e+=1440` 处理。

## 本地还有一份副本

`../减脂打卡/减脂打卡.html` 是本地文件版（手机用 `file://` 直接打开）。
**以本文件夹为准**，本地那份不再单独维护。
