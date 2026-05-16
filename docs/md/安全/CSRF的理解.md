# CSRF 的理解

## 面试定位

CSRF 是前端安全高频题。面试重点是：攻击为什么能成立、它和 XSS 的区别、为什么浏览器会自动带 Cookie、Token / SameSite / Origin 校验分别解决什么问题。

## 核心原理

CSRF（Cross-Site Request Forgery，跨站请求伪造）指攻击者诱导已登录用户访问恶意页面，恶意页面让用户浏览器向目标站点发送请求。由于浏览器会自动携带目标站点的 Cookie，服务端可能误以为这是用户本人发起的操作。

关键条件：

1. 用户已经登录目标站点。
2. 登录态依赖 Cookie 等浏览器自动携带的凭证。
3. 目标接口只根据 Cookie 判断身份。
4. 攻击者能诱导浏览器发起请求。

## 攻击示例

如果银行转账接口错误地使用 GET：

```html
<img src="https://bank.example.com/transfer?to=attacker&amount=1000" />
```

用户访问恶意页面时，浏览器会请求图片地址。如果用户正好登录了 `bank.example.com`，浏览器会自动带上银行站点 Cookie，服务端可能执行转账。

POST 也可能被伪造：

```html
<form action="https://bank.example.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker" />
    <input type="hidden" name="amount" value="1000" />
</form>
<script>
    document.querySelector("form").submit();
</script>
```

## 和 XSS 的区别

XSS 是攻击者让恶意脚本在目标站点页面里执行。

CSRF 是攻击者让用户浏览器向目标站点发起伪造请求，但攻击脚本不一定运行在目标站点里。

简单对比：

| 维度 | XSS | CSRF |
| --- | --- | --- |
| 攻击方式 | 注入并执行脚本 | 伪造请求 |
| 利用凭证 | 可直接读部分数据或发请求 | 利用浏览器自动带 Cookie |
| 发生位置 | 目标站点页面上下文 | 第三方恶意页面也可触发 |
| 防御重点 | 转义、净化、CSP | Token、SameSite、Origin/Referer |

## 防御方式

### CSRF Token

服务端生成随机 Token，页面或接口返回给前端。前端在提交敏感请求时带上 Token，服务端校验 Token 是否正确。

攻击者的第三方页面无法读取目标站点页面里的 Token，因此难以伪造合法请求。

```http
X-CSRF-Token: random-token
```

Token 要求：

- 随机不可预测。
- 和用户会话绑定。
- 敏感操作必须校验。
- 登录后或权限变化时更新。

### SameSite Cookie

`SameSite` 用来控制 Cookie 是否在跨站请求中发送。

```http
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax
```

常见值：

- `Strict`：严格限制跨站携带 Cookie，安全性强，但可能影响体验。
- `Lax`：大多数跨站子请求不带 Cookie，顶级导航 GET 可能携带，默认更平衡。
- `None`：允许跨站携带 Cookie，但必须配合 `Secure`，适合第三方嵌入等场景。

### Origin / Referer 校验

服务端检查请求来源。

```http
Origin: https://www.example.com
Referer: https://www.example.com/profile
```

如果来源不是可信站点，则拒绝敏感操作。

注意：`Referer` 可能因隐私策略缺失，`Origin` 也不是所有请求都有，所以它们适合作为辅助防御，不应作为唯一方案。

### 避免 GET 修改数据

GET 应该只用于查询，不应该执行转账、删除、修改密码等操作。

敏感操作应使用 POST/PUT/DELETE，并配合 Token、SameSite、来源校验。

### 二次验证

高风险操作可以增加二次确认：

- 输入密码。
- 短信或邮箱验证码。
- MFA。
- 操作确认弹窗。

## 常见误区

### 只用 POST 就能防 CSRF？

不能。攻击者可以构造自动提交的表单发送 POST。

### JSON 接口就没有 CSRF？

不绝对。`application/json` 通常会触发 CORS 预检，能提高攻击门槛，但不能把它当作唯一防御。服务端仍应校验 Token 或 Origin。

### CORS 能防 CSRF 吗？

CORS 主要限制浏览器是否允许跨域读取响应。CSRF 的关键是“请求被发送并产生副作用”，攻击者不一定需要读取响应。因此 CORS 不是完整的 CSRF 防御。

## 面试回答

可以这样答：

> CSRF 是跨站请求伪造，攻击者诱导已登录用户访问恶意页面，恶意页面让浏览器向目标站点发请求。因为浏览器会自动携带目标站点 Cookie，如果服务端只看 Cookie 判断身份，就可能把伪造请求当成用户本人操作。防御上首先要保证 GET 不做状态修改；敏感操作使用 CSRF Token，服务端校验随机且和会话绑定的 Token；Cookie 设置 SameSite，减少跨站请求自动带 Cookie；服务端再结合 Origin 或 Referer 校验来源。高风险操作还可以做二次验证。CSRF 和 XSS 不同，XSS 是脚本注入并在目标站点执行，CSRF 是借用户登录态伪造请求。

## 高频追问

### CSRF Token 为什么有效？

因为攻击者可以让浏览器发请求，但通常无法读取目标站点页面里的随机 Token。服务端要求请求带正确 Token，就能识别伪造请求。

### SameSite=Lax 能完全防住 CSRF 吗？

不能完全。它能防很多跨站子请求，但某些顶级导航 GET 仍可能带 Cookie，而且兼容性和业务场景也要考虑。敏感操作仍建议配合 Token。

### CORS 和 CSRF 是一回事吗？

不是。CORS 控制跨域读取响应和部分请求是否放行；CSRF 利用的是浏览器自动携带凭证发请求。即使攻击者读不到响应，只要请求产生副作用也可能攻击成功。

## 相关链接

- [XSS 的理解](/md/安全/XSS的理解.md)
- [OPTIONS 预检请求](/md/网络/OPTIONS预检请求.md)
- [网络与安全](/md/面试准备/技术/网络与安全.md)
