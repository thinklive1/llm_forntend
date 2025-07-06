# llm_forntend

已完成：

- 登陆注册与鉴权（开发阶段为了方便jwt令牌先存在本地）
  - 登陆与注册请求有10秒的cd
  - 没有令牌无法进入管理界面(实际上只检查是否为空，如果伪造的话可以进入管理界面但后端依旧会拒绝请求)
- 模型管理界面的增删查改
- 简单的404页面

后续：

- 主要：
  - 对接模型
- 细节
  - 在前端对输入格式进行校验

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
