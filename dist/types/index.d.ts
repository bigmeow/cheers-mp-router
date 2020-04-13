/**
 * Route 构造实例选项
 */
interface RouterOptions {
    routes?: RouteConfig[];
    adapter?: RouteAdapter;
}
/**
 * 路由定义时的配置
 */
export interface RouteConfig {
    /** 路由name,需保证唯一 */
    name: string;
    /** 路由对应的小程序页面path(和app.json保持一致，路径不以/开头) */
    path: string;
    /** 是否是tab页面,默认false */
    isTab?: boolean;
    /** 携带的额外的参数 */
    meta?: {
        /** 访问路由需要的权限：0 表示不需要任何权限； 1 表示需要 微信授权（可以没有手机号注册）； 2表示必须要手机号注册并且使用手机号登录获得了token */
        authType?: 0 | 1 | 2;
        [key: string]: any;
    };
}
interface Dictionary<T> {
    [key: string]: T;
}
/**
 * 路由函数调用时的传参
 */
export interface Location {
    /** 页面对应的路由名称 */
    name: string;
    /** 传参（对tab页面无效） */
    query?: Dictionary<string | (string | null)[] | null | undefined>;
    /** 是否使用重定向 */
    replace?: boolean;
    /** 是否关闭所有页面，打开到应用内的某个页面 */
    reLaunch?: boolean;
}
/**
 * 路由对象
 */
export interface Route {
    path: string;
    name?: string;
    query: Dictionary<string | (string | null)[]>;
    fullPath: string;
    meta?: any;
}
/**
 * 导航卫士
 */
export declare type NavigationGuard = (
/** 即将要进入的目标 路由对象 */
to: Route, 
/** 当前导航正要离开的路由 */
from: Route, next: (to?: Location | false) => void) => any;
export interface AdapterConfig {
    /** 带参数的小程序完整路径 */
    path: string;
    /** 是否是 tab 页面 */
    isTab: boolean;
    /** 是否使用重定向 */
    replace?: boolean;
    /** 是否关闭所有页面，打开到应用内的某个页面 */
    reLaunch?: boolean;
}
/**
 * 路由适配器
 */
export interface RouteAdapter {
    (config: AdapterConfig): Promise<any>;
}
/**
 * 后置导航卫士
 */
export declare type AfterNavigationHook = (to: Route, from: Route) => any;
export default class Router {
    /** 所有页面的路由配置 */
    private routeConfigList;
    /** 全局前置守卫钩子 */
    private beforeHooks;
    /** 全局后置钩子 */
    private afterHooks;
    /** 当前路由堆栈数量 */
    private stackLength;
    /** 路由适配器，负责具体的路由跳转行为 */
    private adapter;
    /** 路由栈上限数 */
    static MAX_STACK_LENGTH: number;
    constructor(options?: RouterOptions);
    /**
     * 注册路由前置守卫钩子
     * @param hook 钩子函数
     */
    beforeEach(hook: NavigationGuard): Function;
    /**
     * 注册路由后置守卫钩子
     * @param hook 钩子函数
     */
    afterEach(hook: AfterNavigationHook): Function;
    private switchRoute;
    /**
     * 保留当前页面，跳转到应用内的某个页面。
     * @param location 路由跳转参数
     */
    push(location: Location): Promise<unknown>;
    /**
     * 关闭当前页面，跳转到应用内的某个页面。
     * @param location 路由跳转参数
     */
    replace(location: Location): Promise<unknown>;
    /**
     *  关闭当前页面，返回上一页面或多级页面
     * @param delta 返回的页面数，如果 delta 大于现有页面数，则返回到首页。
     */
    back(delta?: number): Promise<unknown>;
    /**
     * 关闭所有页面，打开到应用内的某个页面
     * @param location 路由跳转参数
     */
    reLaunch(location: Location): Promise<unknown>;
    /**
     * 根据路径获取路由配置
     * @param path 小程序路径path(不以/开头)
     */
    getRouteConfigByPath(path: string): RouteConfig | undefined;
    /**
     * 获取当前路由
     */
    getCurrentRoute(): Route;
}
export {};
