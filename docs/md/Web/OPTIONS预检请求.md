# OPTIONS 预检请求

POST 请求前发送的 OPTIONS 请求实际上是 HTTP 的一种特性，称为“预检请求”（Preflight request）。这主要发生在跨域请求（CORS, Cross-Origin Resource Sharing）的场景中，尤其是当请求涉及一些可能不太安全的方法（如 PUT、DELETE 或 POST）或使用了一些自定义的 HTTP 头部时。

预检请求的目的是检查服务器是否允许来自不同源（域、协议或端口）的请求进行某些操作。这样做可以确保客户端在发送实际请求之前，先得到服务器的明确许可。

以下是 OPTIONS 预检请求的主要特点和原因：

- **安全性**：HTTP 协议中的某些方法（如 GET、HEAD、POST）被认为是“安全”的，因为它们不会导致服务器上资源的状态发生变化。但是，其他方法（如 PUT、DELETE 等）可能会导致资源的创建、修改或删除。因此，在发送这些“非安全”请求之前，浏览器会先发送一个 OPTIONS 请求来询问服务器是否允许这样的操作。

- **自定义头部**：如果请求中包含了某些自定义的 HTTP 头部，浏览器也会发送 OPTIONS 请求来询问服务器是否接受这些头部。

- **CORS配置**：服务器在响应 OPTIONS 请求时，可以通过 Access-Control-Allow-Methods、Access-Control-Allow-Headers 等头部来告诉浏览器它允许哪些方法和头部。如果服务器的响应中包含了这些头部，并且允许了客户端想要执行的操作，那么浏览器才会继续发送实际的 POST 请求。

总之，OPTIONS 预检请求是浏览器和服务器之间的一种协商机制，用于确保跨域请求的安全性和合规性。当浏览器认为有必要进行这种检查时，它就会在发送实际请求之前先发送一个 OPTIONS 请求。

## 预检请求的流程

1. 浏览器在发送实际的 POST 请求之前，会先发送一个 OPTIONS 请求。
2. 服务器收到 OPTIONS 请求后，会检查请求的来源、方法和头部，并返回一个包含允许操作的响应。
3. 如果服务器允许请求，浏览器会继续发送实际的 POST 请求。

## 预检请求的头部

OPTIONS 请求的头部通常包括以下内容：

- Origin：请求的来源，即请求的域名。
- Access-Control-Request-Method：请求的方法。
- Access-Control-Request-Headers：请求的头部。

## 预检请求的响应头部

OPTIONS 请求的响应头部通常包括以下内容：

- Access-Control-Allow-Methods：允许的方法。
- Access-Control-Allow-Headers：允许的头部。
- Access-Control-Allow-Origin：允许的来源。
- Access-Control-Allow-Credentials：是否允许携带凭证。
- Access-Control-Max-Age：预检请求的有效期。

### 预检请求的示例

```http
OPTIONS /api/resource HTTP/1.1  
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

### 预检请求的响应示例

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## 预检请求的注意事项

- 预检请求的响应头部的 Access-Control-Allow-Methods 和 Access-Control-Allow-Headers 必须包含实际请求中使用的所有方法和头部。
- 预检请求的响应头部的 Access-Control-Allow-Origin 必须包含实际请求中使用的所有来源。
- 预检请求的响应头部的 Access-Control-Allow-Credentials 必须包含实际请求中使用的所有凭证。
