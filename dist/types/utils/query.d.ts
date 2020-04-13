interface Dictionary {
    [index: string]: any;
}
/**
 * 将 'k1=v1&k2=v2' 格式的字符串转换成 query 对象
 * @param query （可选）要转换的字符串，格式类似于 '?name=admin&password=123' 或者 'name=admin&password=123'
 * @param extraQuery （可选）将转换后的 query 对象 附加到此 query 对象身上
 * @param _parseQuery （可选）自定义转换函数
 */
export declare function resolveQuery(query?: string, extraQuery?: Dictionary, _parseQuery?: Function): Dictionary;
/**
 * 将 query 对象序列化成 'k1=v1&k2=v2' 格式化的字符串
 * @param obj
 */
export declare function stringifyQuery(obj: Dictionary): string;
export {};
