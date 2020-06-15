"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function wechatAdapter(adapterconfig) {
    return new Promise((resolve, reject) => {
        let jumpMethod;
        if (adapterconfig.reLaunch) {
            jumpMethod = wx.reLaunch;
        }
        else if (adapterconfig.isTab) {
            jumpMethod = wx.switchTab;
        }
        else if (adapterconfig.replace) {
            jumpMethod = wx.redirectTo;
        }
        else {
            jumpMethod = wx.navigateTo;
        }
        const params = {
            url: adapterconfig.path,
            success: (res) => {
                resolve(res);
            },
            fail: (res) => {
                reject(res);
            },
        };
        if (adapterconfig.events) {
            params.events = adapterconfig.events;
        }
        jumpMethod.bind(wx)(params);
    });
}
exports.default = wechatAdapter;
//# sourceMappingURL=wechatAdapter.js.map