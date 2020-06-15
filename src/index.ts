import defaultAdapter from './adapter/wechatAdapter'
import { runQueue } from './utils/async'
import { stringifyQuery, resolveQuery } from './utils/query'

/**
 * Route 构造实例选项
 */
interface RouterOptions {
  routes?: RouteConfig[]
  adapter?: RouteAdapter
}

/**
 * 路由定义时的配置
 */
export interface RouteConfig {
  /** 路由name,需保证唯一 */
  name: string
  /** 路由对应的小程序页面path(和app.json保持一致，路径不以/开头) */
  path: string
  /** 是否是tab页面,默认false */
  isTab?: boolean
  /** 携带的额外的参数 */
  meta?: {
    /** 访问路由需要的权限：0 表示不需要任何权限； 1 表示需要 微信授权（可以没有手机号注册）； 2表示必须要手机号注册并且使用手机号登录获得了token */
    authType?: 0 | 1 | 2
    [key: string]: any
  }
}

interface Dictionary<T> {
  [key: string]: T
}

export interface BaseLocation {
  /** 页面对应的路由名称 */
  name: string
  /** 传参（对`tabbar`页面无效） */
  query?: Dictionary<string | (string | null)[] | null | undefined>
}

/**
 * 路由push函数调用时的传参
 */
export interface PushLocation extends BaseLocation {
  /** 是否使用重定向,默认false */
  replace?: boolean
  /** 页面间通信接口，用于监听被打开页面发送到当前页面的数据。基础库 2.7.3 开始支持。仅对 router.push 支持 */
  events?: WechatMiniprogram.IAnyObject
}

/**
 * 路由函数调用时的完整传参
 */
export interface Location extends PushLocation {
  /** 是否使用重定向 */
  replace?: boolean
  /** 是否关闭所有页面，打开到应用内的某个页面 */
  reLaunch?: boolean
}

/**
 * 路由对象
 */
export interface Route {
  path: string
  name?: string
  query: Dictionary<string | (string | null)[]>
  fullPath: string
  meta?: any
}

/**
 * 导航卫士
 */
export type NavigationGuard = (
  /** 即将要进入的目标 路由对象 */
  to: Route,
  /** 当前导航正要离开的路由 */
  from: Route,
  next: (to?: Location | false) => void
) => any

export interface AdapterConfig {
  /** 带参数的小程序完整路径 */
  path: string
  /** 是否是 tab 页面 */
  isTab: boolean
  /** 是否使用重定向 */
  replace?: boolean
  /** 是否关闭所有页面，打开到应用内的某个页面 */
  reLaunch?: boolean
  /** 页面间通信接口，用于监听被打开页面发送到当前页面的数据。基础库 2.7.3 开始支持。仅对 router.push 支持 */
  events?: WechatMiniprogram.IAnyObject
}
/**
 * 路由适配器
 */
export interface RouteAdapter {
  (config: AdapterConfig): Promise<any>
}

/**
 * 后置导航卫士
 */
export declare type AfterNavigationHook = (to: Route, from: Route) => any

/**
 * 生成路由对象
 * @param routeConfig
 * @param query
 */
function generateRoute(routeConfig: RouteConfig, query: any) {
  const route: Route = {
    name: routeConfig.name,
    path: routeConfig.path,
    fullPath: routeConfig.path + stringifyQuery(query),
    query: Object.assign({}, query),
    meta: routeConfig.meta || {},
  }
  return route
}

function registerHook(list: any[], fn: Function): Function {
  list.push(fn)
  return () => {
    const i = list.indexOf(fn)
    if (i > -1) list.splice(i, 1)
  }
}

export default class Router {
  /** 所有页面的路由配置 */
  private routeConfigList: RouteConfig[] = []

  /** 全局前置守卫钩子 */
  private beforeHooks: NavigationGuard[]

  /** 全局后置钩子 */
  private afterHooks: AfterNavigationHook[]

  /** 当前路由堆栈数量 */
  private stackLength: number

  /** 路由适配器，负责具体的路由跳转行为 */
  private adapter: RouteAdapter = defaultAdapter

  /** 路由栈上限数 */
  public static MAX_STACK_LENGTH = 10

  /** 将 query 对象序列化成 'k1=v1&k2=v2' 格式化的字符串 */
  public static stringifyQuery = stringifyQuery

  /** 将 'k1=v1&k2=v2' 格式的字符串转换成 query 对象 */
  public static resolveQuery = resolveQuery

  constructor(options: RouterOptions = {}) {
    if (options.routes) {
      // 统一替换处理，不以/前缀开头
      options.routes.forEach((route) => route.path.replace(/^\//, ''))
      this.routeConfigList = options.routes
    }
    if (options.adapter) {
      this.adapter = options.adapter
    }
    this.beforeHooks = []
    this.afterHooks = []
    this.stackLength = 0
  }

  /**
   * 注册路由前置守卫钩子
   * @param hook 钩子函数
   */
  beforeEach(hook: NavigationGuard): Function {
    return registerHook(this.beforeHooks, hook)
  }

  /**
   * 注册路由后置守卫钩子
   * @param hook 钩子函数
   */
  afterEach(hook: AfterNavigationHook): Function {
    return registerHook(this.afterHooks, hook)
  }

  private switchRoute(location: Location): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let routeConfig = this.routeConfigList.find((item) => item.name === location.name)
      if (!routeConfig) {
        reject(new Error('未找到该路由:' + location.name))
        return
      }
      const currentRoute = this.getCurrentRoute()
      const toRoute = generateRoute(routeConfig, location.query)
      if (
        !location.replace &&
        !location.reLaunch &&
        !routeConfig.isTab &&
        this.stackLength >= Router.MAX_STACK_LENGTH
      ) {
        console.warn('超出navigateTo最大限制，改用redirectTo')
        location.replace = true
      }

      const iterator = (hook: NavigationGuard, next: Function) => {
        hook(toRoute, currentRoute, async (v) => {
          if (v === false) return
          else if (typeof v === 'object') {
            try {
              await this.switchRoute(v)
            } catch (error) {
              reject(error)
            }
          } else {
            next()
          }
        })
      }
      runQueue(this.beforeHooks, iterator, async () => {
        try {
          const result = await this.adapter({
            // 跳转前统一加上 "/" 前缀
            path: '/' + toRoute.fullPath,
            isTab: routeConfig!.isTab || false,
            replace: location.replace,
            reLaunch: location.reLaunch,
            events: location.events,
          })
          resolve(result)
          this.afterHooks.forEach((hook) => {
            hook && hook(toRoute, currentRoute)
          })
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * 保留当前页面，跳转到应用内的某个页面, 对应小程序的 `wx.navigateTo` , 使用 `router.back()` 可以返回到原页面。
   * 如果页面是 tabbar 会自动切换成 `wx.switchTab` 跳转；
   * 如果小程序中页面栈超过十层，会自动切换成 `wx.redirectTo` 跳转。
   * @param location 路由跳转参数
   */
  push(location: PushLocation): Promise<WechatMiniprogram.NavigateToSuccessCallbackResult> {
    return this.switchRoute(location)
  }

  /**
   * 关闭当前页面，跳转到应用内的某个页面;
   * 如果页面是 `tabbar` 会自动切换成 `wx.switchTab` 跳转，但是 `tabbar` 不支持传递参数。
   * @param location 路由跳转参数
   */
  replace(location: BaseLocation): Promise<WechatMiniprogram.GeneralCallbackResult> {
    ;(location as Location).replace = true
    return this.switchRoute(location)
  }

  /**
   *  关闭当前页面，返回上一页面或多级页面
   * @param delta 返回的页面数，如果 delta 大于现有页面数，则返回到首页。
   */
  back(delta = 1): Promise<WechatMiniprogram.GeneralCallbackResult> {
    if (delta < 1) delta = 1
    return new Promise((resolve, reject) => {
      wx.navigateBack({
        delta,
        success: (res) => {
          // const route = this.stack[targetIndex]
          resolve(res)
        },
        fail: (res) => {
          // {"errMsg":"navigateBack:fail cannot navigate back at first page."}
          reject(res)
        },
      })
    })
  }

  /**
   * 关闭所有页面，打开到应用内的某个页面
   * @param location 路由跳转参数
   */
  reLaunch(location: BaseLocation): Promise<WechatMiniprogram.GeneralCallbackResult> {
    ;(location as Location).reLaunch = true
    return this.switchRoute(location)
  }

  /**
   * 根据路径获取路由配置
   * @param path 小程序路径path(不以/开头)
   */
  getRouteConfigByPath(path: string) {
    if (path.indexOf('?') > -1) {
      path = path.substring(0, path.indexOf('?'))
    }
    return this.routeConfigList.find((item) => item.path === path)
  }

  /**
   * 获取当前路由
   */
  getCurrentRoute() {
    let pages = getCurrentPages()
    let currentPage = pages[pages.length - 1]
    this.stackLength = pages.length
    let routeConfig = this.getRouteConfigByPath(currentPage.route)
    if (!routeConfig) throw new Error('当前页面' + currentPage.route + '对应的路由未配置')
    return generateRoute(routeConfig, currentPage.options)
  }
}
