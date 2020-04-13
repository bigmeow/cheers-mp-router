"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.resolveQuery = resolveQuery;
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
exports.stringifyQuery = stringifyQuery;
//# sourceMappingURL=query.js.map