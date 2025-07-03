# llm_forntend

This template should help get you started developing with Vue 3 in Vite.

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

document.addEventListener('DOMContentLoaded', () => {
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;

    // 在实际应用中，这里会发送一个请求到后端服务器进行验证
    if (username === 'admin' && password === 'password') {
      alert('登录成功！正在跳转到管理后台...');

      // 跳转到管理后台页面
      // 请确保管理后台文件名为 "admin.html" 且在同一目录下
      window.location.href = 'index.html';
    } else {
      // 显示错误提示
      errorMessage.textContent = '用户名或密码错误，请重试。';
      errorMessage.classList.remove('hidden');
    }
});
