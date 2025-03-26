# 跨站请求伪造（CSRF）

CSRF（有时也称为 XSRF）是一类相关的攻击。攻击者使用户的浏览器在用户不知情的情况下向网站的后端发送请求。攻击者可以使用 XSS 载荷发起 CSRF 攻击。

## 示例

维基百科提到了一个很好的 CSRF 示例。在这种情况下，某人访问了一个实际上并不是图像的图像（例如在未经过滤的聊天或论坛中），而是向银行服务器发出取款请求：

```html
<img
  src="https://bank.example.com/withdraw?account=bob&amount=1000000&for=mallory" />
```

现在如果你登录银行账户并且你的 cookie 仍然有效（并且没有其他验证），那么在加载包含此图像的 HTML 后你将立即转账。对于需要 POST 请求的端点，可以在加载页面时以编程方式触发 <form> 提交（可能在不可见的 \<iframe> 中）：

```html

<form action="https://bank.example.com/withdraw" method="POST">
  <input type="hidden" name="account" value="bob" />
  <input type="hidden" name="amount" value="1000000" />
  <input type="hidden" name="for" value="mallory" />
</form>
<script>
  window.addEventListener("DOMContentLoaded", () => {
    document.querySelector("form").submit();
  });
</script>

```

攻击者通常会在第三方网站上注入恶意代码，当用户访问该网站时，恶意代码会向目标网站发送伪造的请求，从而执行攻击行为。例如，攻击者可以通过伪造的请求，以用户的身份修改密码、转账等操作，从而造成损失或泄露敏感信息。

## 防范 CSRF 攻击的主要方法包括

- GET 端点应该是幂等的——执行更改但不检索数据的操作应该要发送 POST（或其他 HTTP 方法）请求。POST 端点不应接受带有查询字符串参数的 GET 请求。
- 服务器应向浏览器提供会话唯一的 CSRF 令牌。然后，只要浏览器提交表单（在 <form> 元素的隐藏输入字段中），就可以包含此令牌。对于所有可能执行操作的非 GET 请求，服务器会将接收到的令牌与其存储的会话值进行比较。如果令牌不匹配，请求将被中止。
这种保护方法依赖于攻击者无法预测用户分配的 CSRF 令牌。应在登录时重新生成令牌。
- 用于敏感操作的 Cookie（例如会话 Cookie）应具有较短的生命周期，并且 SameSite 属性设置为 Strict 或 Lax。在支持的浏览器中，这将确保会话 cookie 不会随跨站请求一起发送，因此对应用程序服务器来说这个请求是未经验证的。
- 应一起部署 CSRF 令牌和 SameSite cookie。这可确保所有浏览器都受到保护，并在 SameSite cookie 无法提供帮助的情况下提供保护（例如来自单独子域的攻击）。
