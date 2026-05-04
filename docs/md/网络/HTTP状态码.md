# HTTP状态码

## 1xx 信息性状态码

- 100 Continue：表示目前为止一切正常，客户端应该继续请求，如果已完成请求则忽略。

- 101 Switching Protocols：表示服务器应客户端升级协议的请求（Upgrade请求头）正在切换协议。

```web
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

- 102 Processing：向客户端表示已收到完整请求，并且服务器正在处理该请求。（仅当服务器预计请求需要很长时间时会发送此状态码，以告知客户端请求尚未终止。）

- 103 Early Hints：一般和 Link header（首部）一起使用，来允许用户在服务器还在准备响应数据的时候预加载一些资源。

## 2xx 成功状态码

- 200 OK：表明请求已经成功。默认情况下状态码为 200 的响应可以被缓存。

```markdown
### 不同请求方式对于请求成功的意义如下：

- GET: 已经取得资源，并将资源添加到响应的消息体中。
- HEAD: 响应的消息体为头部信息。
- POST: 响应的消息体中包含此次请求的结果。
- TRACE: 响应的消息体中包含服务器接收到的请求信息。

PUT 和 DELETE 的请求成功通常并不是响应200 OK的状态码而是 204 No Content 表示无内容（或者 201 Created表示一个资源首次被创建成功）。
```

- 201 Created：表示请求已经被成功处理，并且创建了新的资源。新的资源在应答返回之前已经被创建。同时新增的资源会在应答消息体中返回，其地址或者是原始请求的路径，或者是 Location 首部的值。（这个状态码的常规使用场景是作为 POST 请求的返回值。）

- 202 Accepted：表示请求已经接受，但服务器尚未处理完成。

- 203 Non-Authoritative Information：表示服务器已经成功处理了请求，但是返回的信息可能来自另一个来源。

- 204 No Content：表示服务器已经成功处理了请求，但是没有返回任何内容。

- 205 Reset Content：表示服务器已经成功处理了请求，但是没有返回任何内容，并且要求客户端重置文档视图。

- 206 Partial Content：表示服务器已经成功处理了部分请求，并且返回了部分内容。

- 207 Multi-Status：

- 208 Already Reported：

- 226 IM Used：

## 3xx 重定向状态码

- 300 Multiple Choices：

- 301 Moved Permanently：

- 302 Found：

- 303 See Other：

- 304 Not Modified：

- 305 Use Proxy：
