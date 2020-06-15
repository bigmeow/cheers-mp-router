# cheers-mp-router
🚦精巧强大的小程序路由

## 催更、钉钉交流群：

<img width="200" alt="钉钉交流群" src="https://image-static.segmentfault.com/428/097/4280971404-5e8c793fa8d8f_articlex" />

## 使用

#### 安装
``` bash
npm i cheers-mp-router
```

#### typescript引入
``` typescript
import Router, { RouteConfig } from "cheers-mp-router";


// 定义路由配置
const routeConfigList: RouteConfig[] = [
  { name: "test-tabbar", path: "pages/tabbar/test-tabbar/index", isTab: true },
  { name: "testA", path: "test/pages/testA/index" },
  { name: "testB", path: "test/pages/testB/index" },
  { name: "product-details", path: "test/pages/product-details/index" }
];

// 实例化
const router = new Router({ routes: routeConfigList });

// 注册全局 beforeEach 钩子；使用方式和 vue-router 的 beforeEach 基本一致
router.beforeEach((to, from, next) => {
  console.log("当前路由", from);
  console.log("即将前往的路由", to);
  next();
  // next({ name: "pageB" });
  // next(false)
});

// 注册全局 afterEach 钩子
router.afterEach((current, from) => {
  console.log("跳转成功，当前路由:", current);
  console.log("之前路由:", from);
});

// 调用路由方法
router.push({ name: "testA" })

// 调用路由传参数
router.push({ name: "product-details", query: { id: "sb" } })
```

## 实例API

具体[查看这里](./dist/types/index.d.ts)

## TODO
- [x] 在 [cheers-mp](https://github.com/bigmeow/cheers-mp) 脚手架中使用时获得构建级别的路由支持、子包构建支持
- [x] push 支持 [eventChannel](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html) 事件监听
