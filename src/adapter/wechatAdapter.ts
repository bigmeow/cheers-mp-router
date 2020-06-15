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
    const params: WechatMiniprogram.NavigateToOption = {
      url: adapterconfig.path,
      success: (res) => {
        resolve(res)
      },
      fail: (res) => {
        reject(res)
      },
    }

    if (adapterconfig.events) {
      params.events = adapterconfig.events
    }
    jumpMethod.bind(wx)(params)
  })
}
