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
        jumpMethod.bind(wx)({
            url: adapterconfig.path,
            success: (res) => {
                resolve(res);
            },
            fail: (res) => {
                reject(res);
            },
        });
    });
}
exports.default = wechatAdapter;
//# sourceMappingURL=wechatAdapter.js.map