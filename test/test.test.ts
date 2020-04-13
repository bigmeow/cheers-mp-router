import Router from "../src/index"

describe('自定义适配器', function() {
  it('', async function(done) {
    let called = false
    const route = new Router({
      routes: [
        {
          name: "test-page-a",
          path: "pages/test-page-a"
        }
      ],
      adapter: async (adapterConfig) => {
        called = true
      }
    })
    await route.push({
      name: "test-page-a"
    })
    expect(called).toEqual(true);
    done()
  })

})
