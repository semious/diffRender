### fast-render

#### 它是什么
它是webview环境中的由string转成DOM的一个渲染工具

#### 它解决什么问题
为了提升webview中操作DOM中的昂贵的性能代价,使DOM的变化最小化，现在大多数的方式是用innerHTML，但是对于大块的HTML，渲染性能比较差，特别
是list类型的渲染，并且会卡住webview，在做全屏paint的时候

#### 它的来源以及为什么要有这个
它受到fb的react的virtualDOM的启发，目的是为了更快的页面渲染。fb的react的方式，本人实在无法接受，将html标签以string/object的方式，
写入js当中去，或者使用自定义的JSX。因此本人决定写一个轻量级，且无感知的方式，实现类似virtualDOM中的diff的操作

#### 它的特点
1. 不是万能工具，不做全部的事情，不解决所有角角落落和很罕见的问题，为了解决大部分的渲染问题，其余问题，开发者需要自己解决
2. 性能敏感，由于操作DOM很费时间，因此如果发现耗时超出预期，直接使用传统的innerHTML的方法
3. 完全对使用者透明，即使用者像用innerHTML一样，使用，没有任何学习成本，只有一个api
4. 在性能和可读性上取平衡，保证性能的同时，其他开发者可以随便取出代码，在上面改改，改成自己的东西以适合自己实际业务场景
5. smart and efficiency

#### 设计原则
1. 不做上帝工具
2. 适当解决重点渲染问题
3. 性能优先，功能第二
4. 信任原则，不做各种不合理的非常规检验
5. 不给使用者埋非本工具需要解决的坑，但也不会给使用者挖坑

#### 使用场景
1. 适合展示型为主的页面
2. 适合使用模板生成的纯html的场景，不适合里面包含js和css脚本

#### 策略
1. 使用worker方式进行解析构建的方式，并且非强制策略，如果没有parse好，宁可采用innerHTML的方式，保证之前的方式的性能不降低
2. 使用逐渐下层到底层的结构解析，使用Window.requestAnimationFrame的方式，逐渐细化，进行分散式，片段解析
3. 对于非常用标签，粗对待，不对所有标签进行精细操作
4. 碎片化渲染，在一个requestFrame的时间内渲染一个不超过16ms的渲染过程
5. 使用worker的方式，进行分布式的碎片渲染
6. 对于解析较差的环境，不再动态解析，降级到innerHTML方式
7. 对于解析出错的情况，一律采用降级方案
8. diff对比，不采用穷尽对比，设置差异阈值，超过阈值，不再diff，直接采用innerHTML的string
9. patch时，性能最优先考虑
10. 渐进式diff，diff和patch同步进行
11. 采用fb的[diff算法](https://github.com/reactjs-cn/react-docs/blob/master/zh/docs/ref-08-reconciliation.md)（Pair-wise diff，List-wise diff和Trade-offs原则）

#### 潜规则
1. 对于完全空白的text节点，不进行解析
2. 对于text节点中含有多个空格的对自动替换成一个空格
1. 不支持script,CDDATA,comment,style,link节点
1. 不对乱写标签进行检测，比如说div自闭和<div />，乱写

#### 借鉴的类库
1. [reactjs](http://facebook.github.io/react/)
2. [htmlparser](https://github.com/tautologistics/node-htmlparser)
3. [diffDOM](https://github.com/fiduswriter/diffDOM)