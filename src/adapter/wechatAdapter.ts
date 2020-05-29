import { AdapterConfig } from '../index'

export default function wechatAdapter(
  adapterconfig: AdapterConfig
): Promise<WechatMiniprogram.GeneralCallbackResult> {
  return new Promise((resolve, reject) => {
    let jumpMethod: any
    if (adapterconfig.reLaunch) {
      jumpMethod = wx.reLaunch
    } else if (adapterconfig.isTab) {
      jumpMethod = wx.switchTab
    } else if (adapterconfig.replace) {
      jumpMethod = wx.redirectTo
    } else {
      jumpMethod = wx.navigateTo
    }
    jumpMethod.bind(wx)({
      url: adapterconfig.path,
      success: (res: WechatMiniprogram.GeneralCallbackResult) => {
        resolve(res)
      },
      fail: (res: WechatMiniprogram.GeneralCallbackResult) => {
        reject(res)
      },
    })
  })
}
