function wechatAdapter(adapterconfig) {
    return new Promise((resolve, reject) => {
        let jumpMethod;
        if (adapterconfig.isTab) {
            jumpMethod = wx.switchTab;
        }
        else if (adapterconfig.replace) {
            jumpMethod = wx.redirectTo;
        }
        else if (adapterconfig.reLaunch) {
            jumpMethod = wx.reLaunch;
        }
        else {
            jumpMethod = wx.navigateTo;
        }
        jumpMethod.bind(wx)({
            url: adapterconfig.path,
            success: () => {
                resolve();
            },
            fail: (res) => {
                reject(res);
            }
        });
    });
}

function runQueue(queue, fn, cb) {
    const step = (index) => {
        if (index >= queue.length) {
            cb();
        }
        else {
            if (queue[index]) {
                fn(queue[index], () => {
                    step(index + 1);
                });
            }
            else {
                step(index + 1);
            }
        }
    };
    step(0);
}

const encodeReserveRE = /[!'()*]/g;
const encodeReserveReplacer = (c) => '%' + c.charCodeAt(0).toString(16);
const commaRE = /%2C/g;
// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
const encode = (str) => encodeURIComponent(str)
    .replace(encodeReserveRE, encodeReserveReplacer)
    .replace(commaRE, ',');
const decode = decodeURIComponent;
function parseQuery(query) {
    const res = {};
    query = query.trim().replace(/^(\?|#|&)/, '');
    if (!query) {
        return res;
    }
    query.split('&').forEach(param => {
        const parts = param.replace(/\+/g, ' ').split('=');
        const key = decode(parts.shift());
        const val = parts.length > 0 ? decode(parts.join('=')) : null;
        if (res[key] === undefined) {
            res[key] = val;
        }
        else if (Array.isArray(res[key])) {
            res[key].push(val);
        }
        else {
            res[key] = [res[key], val];
        }
    });
    return res;
}
/**
 * 将 'k1=v1&k2=v2' 格式的字符串转换成 query 对象
 * @param query （可选）要转换的字符串，格式类似于 '?name=admin&password=123' 或者 'name=admin&password=123'
 * @param extraQuery （可选）将转换后的 query 对象 附加到此 query 对象身上
 * @param _parseQuery （可选）自定义转换函数
 */
function resolveQuery(query, extraQuery = {}, _parseQuery) {
    const parse = _parseQuery || parseQuery;
    let parsedQuery;
    try {
        parsedQuery = parse(query || '');
    }
    catch (e) {
        parsedQuery = {};
    }
    for (const key in extraQuery) {
        parsedQuery[key] = extraQuery[key];
    }
    return parsedQuery;
}
/**
 * 将 query 对象序列化成 'k1=v1&k2=v2' 格式化的字符串
 * @param obj
 */
function stringifyQuery(obj) {
    const res = obj
        ? Object.keys(obj)
            .map(key => {
            const val = obj[key];
            if (val === undefined) {
                return '';
            }
            if (val === null) {
                return encode(key);
            }
            if (Array.isArray(val)) {
                const result = [];
                val.forEach(val2 => {
                    if (val2 === undefined) {
                        return;
                    }
                    if (val2 === null) {
                        result.push(encode(key));
                    }
                    else {
                        result.push(encode(key) + '=' + encode(val2));
                    }
                });
                return result.join('&');
            }
            return encode(key) + '=' + encode(val);
        })
            .filter(x => x.length > 0)
            .join('&')
        : null;
    return res ? `?${res}` : '';
}

/**
 * 生成路由对象
 * @param routeConfig
 * @param query
 */
function generateRoute(routeConfig, query) {
    const route = {
        name: routeConfig.name,
        path: routeConfig.path,
        fullPath: routeConfig.path + stringifyQuery(query),
        query: Object.assign({}, query),
        meta: routeConfig.meta || {}
    };
    return route;
}
function registerHook(list, fn) {
    list.push(fn);
    return () => {
        const i = list.indexOf(fn);
        if (i > -1)
            list.splice(i, 1);
    };
}
class Router {
    constructor(options = {}) {
        /** 所有页面的路由配置 */
        this.routeConfigList = [];
        /** 路由适配器，负责具体的路由跳转行为 */
        this.adapter = wechatAdapter;
        if (options.routes) {
            // 统一替换处理，不以/前缀开头
            options.routes.forEach(route => route.path.replace(/^\//, ''));
            this.routeConfigList = options.routes;
        }
        if (options.adapter) {
            this.adapter = options.adapter;
        }
        this.beforeHooks = [];
        this.afterHooks = [];
        this.stackLength = 0;
    }
    /**
     * 注册路由前置守卫钩子
     * @param hook 钩子函数
     */
    beforeEach(hook) {
        return registerHook(this.beforeHooks, hook);
    }
    /**
     * 注册路由后置守卫钩子
     * @param hook 钩子函数
     */
    afterEach(hook) {
        return registerHook(this.afterHooks, hook);
    }
    switchRoute(location) {
        return new Promise(async (resolve, reject) => {
            let routeConfig = this.routeConfigList.find(item => item.name === location.name);
            if (!routeConfig) {
                reject(new Error('未找到该路由:' + location.name));
                return;
            }
            const currentRoute = this.getCurrentRoute();
            const toRoute = generateRoute(routeConfig, location.query);
            if (!location.replace &&
                !location.reLaunch &&
                !routeConfig.isTab &&
                this.stackLength >= Router.MAX_STACK_LENGTH) {
                console.warn('超出navigateTo最大限制，改用redirectTo');
                location.replace = true;
            }
            const iterator = (hook, next) => {
                hook(toRoute, currentRoute, async (v) => {
                    if (v === false)
                        return;
                    else if (typeof v === 'object') {
                        try {
                            await this.switchRoute(v);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else {
                        next();
                    }
                });
            };
            runQueue(this.beforeHooks, iterator, async () => {
                try {
                    await this.adapter({
                        // 跳转前统一加上 "/" 前缀
                        path: '/' + toRoute.fullPath,
                        isTab: routeConfig.isTab || false,
                        replace: location.replace,
                        reLaunch: location.reLaunch
                    });
                    resolve();
                    this.afterHooks.forEach(hook => {
                        hook && hook(toRoute, currentRoute);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    /**
     * 保留当前页面，跳转到应用内的某个页面。
     * @param location 路由跳转参数
     */
    push(location) {
        return this.switchRoute(location);
    }
    /**
     * 关闭当前页面，跳转到应用内的某个页面。
     * @param location 路由跳转参数
     */
    replace(location) {
        location.replace = true;
        return this.switchRoute(location);
    }
    /**
     *  关闭当前页面，返回上一页面或多级页面
     * @param delta 返回的页面数，如果 delta 大于现有页面数，则返回到首页。
     */
    back(delta = 1) {
        if (delta < 1)
            delta = 1;
        return new Promise((resolve, reject) => {
            wx.navigateBack({
                delta,
                success: () => {
                    // const route = this.stack[targetIndex]
                    resolve();
                },
                fail: res => {
                    // {"errMsg":"navigateBack:fail cannot navigate back at first page."}
                    reject(res);
                }
            });
        });
    }
    /**
     * 关闭所有页面，打开到应用内的某个页面
     * @param location 路由跳转参数
     */
    reLaunch(location) {
        location.reLaunch = true;
        return this.switchRoute(location);
    }
    /**
     * 根据路径获取路由配置
     * @param path 小程序路径path(不以/开头)
     */
    getRouteConfigByPath(path) {
        if (path.indexOf('?') > -1) {
            path = path.substring(0, path.indexOf('?'));
        }
        return this.routeConfigList.find(item => item.path === path);
    }
    /**
     * 获取当前路由
     */
    getCurrentRoute() {
        let pages = getCurrentPages();
        let currentPage = pages[pages.length - 1];
        this.stackLength = pages.length;
        let routeConfig = this.getRouteConfigByPath(currentPage.route);
        if (!routeConfig)
            throw new Error('当前页面' + currentPage.route + '对应的路由未配置');
        return generateRoute(routeConfig, currentPage.options);
    }
}
/** 路由栈上限数 */
Router.MAX_STACK_LENGTH = 10;
/** 将 query 对象序列化成 'k1=v1&k2=v2' 格式化的字符串 */
Router.stringifyQuery = stringifyQuery;
/** 将 'k1=v1&k2=v2' 格式的字符串转换成 query 对象 */
Router.resolveQuery = resolveQuery;

export default Router;
//# sourceMappingURL=index.es.js.map
